"""
LMS Plans API Endpoints
备课计划管理接口实现
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, select
from typing import List, Optional
from uuid import uuid, UUID4
import logging
from datetime import datetime, date

from backend.app.database import get_db
from backend.app.models import (
    Student, LessonPlan, StudentRecord, TaskLibrary, PublishBatch
)
from backend.app.schemas import (
    PlanPublishRequest, PublishPlanResponse, PublishPlanResponseData,
    AcademicMapResponse, AcademicMapResponseData,
    StudentProgressResponse, CurrentProgress, StudentProgressUpdate,
    TaskLibraryResponse, TaskLibraryItem,
    BatchSettleRequest, BatchSettleResponse
)
from backend.app.services.student_service import StudentService
from backend.app.services.progress_service import ProgressService

router = APIRouter(prefix="/api/plans", tags=["plans"])
logger = logging.getLogger(__name__)


@router.post("/publish", response_model=PublishPlanResponse)
async def publish_plan(
    request: PlanPublishRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    发布备课计划

    核心逻辑：
    1. 写入 lms_lesson_plans
    2. Fan-out: 为全班学生生成 lms_student_record
    3. 处理个性化加餐 (specialTasks)
    """
    try:
        # 1. 生成批次ID
        batch_id = str(uuid.uuid4())
        publish_date = datetime.strptime(request.publish_date, '%Y-%m-%d').date()

        # 2. 获取目标学生列表
        student_service = StudentService(db)
        if request.target_student_ids:
            students = await student_service.get_students_by_ids(request.target_student_ids)
        else:
            # 获取教师所有学生（基于teacher_id）
            students = await student_service.get_students_by_teacher(request.teacher_id)

        if not students:
            raise HTTPException(status_code=404, detail="未找到目标学生")

        # 3. 准备课程进度数据
        course_progress = {
            "chinese": {
                "unit": request.course_info.chinese.unit,
                "lesson": request.course_info.chinese.lesson,
                "title": request.course_info.chinese.title
            },
            "math": {
                "unit": request.course_info.math.unit,
                "lesson": request.course_info.math.lesson,
                "title": request.course_info.math.title
            },
            "english": {
                "unit": request.course_info.english.unit,
                "lesson": None,  # 英语可能没有lesson
                "title": request.course_info.english.title
            }
        }

        # 4. 创建备课计划记录（每个学科一条）
        plan_ids = {}
        for subject, lesson_info in course_progress.items():
            if subject == "english":
                # 英语科目特殊处理
                lesson_plan = LessonPlan(
                    teacher_id=request.teacher_id,
                    subject=subject,
                    unit=int(lesson_info["unit"]),
                    lesson=0,  # 英语设置默认值
                    title=lesson_info["title"],
                    course_progress={subject: lesson_info},
                    qc_config=request.qc_items,
                    is_published=True,
                    publish_date_date=publish_date,
                    batch_id=batch_id,
                    total_students=len(students)
                )
            else:
                lesson_plan = LessonPlan(
                    teacher_id=request.teacher_id,
                    subject=subject,
                    unit=int(lesson_info["unit"]),
                    lesson=int(lesson_info["lesson"]),
                    title=lesson_info["title"],
                    course_progress={subject: lesson_info},
                    qc_config=request.qc_items,
                    is_published=True,
                    publish_date_date=publish_date,
                    batch_id=batch_id,
                    total_students=len(students)
                )

            db.add(lesson_plan)
            db.flush()
            plan_ids[subject] = lesson_plan.id

        # 5. Fan-out: 为每个学生创建学习记录
        created_records = 0
        special_task_count = 0
        estimated_total_exp = 0

        # 5.1 首先创建普通QC和TASK记录
        for student in students:
            for subject, plan_id in plan_ids.items():
                # 创建QC记录
                qc_items = request.qc_items.get(subject, [])
                for qc_item in qc_items:
                    student_record = StudentRecord(
                        student_id=student.id,
                        plan_id=plan_id,
                        task_name=qc_item,
                        task_category="QC",
                        status="pending",
                        exp_value=15,  # QC任务默认15经验值
                        lesson_subject=subject,
                        lesson_unit=int(course_progress[subject]["unit"]),
                        lesson_lesson=int(course_progress[subject]["lesson"]) if subject != "english" else 0,
                        lesson_title=course_progress[subject]["title"],
                        batch_id=batch_id
                    )
                    db.add(student_record)
                    created_records += 1
                    estimated_total_exp += 15

                # 创建TASK记录
                for task_name in request.tasks:
                    # 从任务库获取经验值
                    task_library = db.query(TaskLibrary).filter(
                        and_(
                            TaskLibrary.name == task_name,
                            TaskLibrary.is_active == True
                        )
                    ).first()
                    exp_value = task_library.default_exp if task_library else 10

                    student_record = StudentRecord(
                        student_id=student.id,
                        plan_id=plan_id,
                        task_name=task_name,
                        task_category="TASK",
                        status="pending",
                        exp_value=exp_value,
                        lesson_subject=subject,
                        lesson_unit=int(course_progress[subject]["unit"]),
                        lesson_lesson=int(course_progress[subject]["lesson"]) if subject != "english" else 0,
                        lesson_title=course_progress[subject]["title"],
                        batch_id=batch_id
                    )
                    db.add(student_record)
                    created_records += 1
                    estimated_total_exp += exp_value

        # 5.2 处理个性化加餐任务
        student_name_to_id = {student.name: student.id for student in students}

        for special_task in request.special_tasks:
            for student_name in special_task.students:
                if student_name not in student_name_to_id:
                    logger.warning(f"学生未找到: {student_name}")
                    continue

                student_id = student_name_to_id[student_name]

                for task_name in special_task.tasks:
                    # 从任务库获取经验值
                    task_library = db.query(TaskLibrary).filter(
                        and_(
                            TaskLibrary.name == task_name,
                            TaskLibrary.is_active == True
                        )
                    ).first()
                    exp_value = task_library.default_exp if task_library else 30  # 个性化任务默认30经验值

                    student_record = StudentRecord(
                        student_id=student_id,
                        plan_id=list(plan_ids.values())[0],  # 使用第一个计划ID
                        task_name=task_name,
                        task_category="SPECIAL",
                        status="pending",
                        exp_value=exp_value,
                        is_special=True,
                        batch_id=batch_id
                    )
                    db.add(student_record)
                    created_records += 1
                    special_task_count += 1
                    estimated_total_exp += exp_value

        # 6. 创建发布批次记录
        publish_batch = PublishBatch(
            teacher_id=request.teacher_id,
            publish_date=publish_date,
            total_plans=len(plan_ids),
            total_students=len(students),
            total_records=created_records,
            status="published",
            batch_id=batch_id
        )
        db.add(publish_batch)

        # 7. 提交事务
        db.commit()

        # 8. 返回成功响应
        response_data = PublishPlanResponseData(
            plan_id=list(plan_ids.values())[0],  # 返回第一个计划ID
            batch_id=batch_id,
            created_records=created_records,
            affected_students=len(students),
            special_task_count=special_task_count,
            estimated_total_exp=estimated_total_exp
        )

        logger.info(f"备课计划发布成功: {response_data.dict()}")

        return PublishPlanResponse(
            success=True,
            message="备课计划发布成功",
            data=response_data
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"发布备课计划失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"发布失败: {str(e)}")


@router.get("/today", response_model=List[dict])
async def get_today_plan(
    teacher_id: str,
    publish_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    获取今日备课计划
    """
    try:
        if not publish_date:
            publish_date = date.today()
        else:
            publish_date = datetime.strptime(publish_date, '%Y-%m-%d').date()

        # 查询今日备课计划
        plans = db.query(LessonPlan).filter(
            and_(
                LessonPlan.teacher_id == teacher_id,
                LessonPlan.publish_date_date == publish_date,
                LessonPlan.is_published == True
            )
        ).all()

        return [
            {
                "id": str(plan.id),
                "subject": plan.subject,
                "course_progress": plan.course_progress,
                "qc_config": plan.qc_config,
                "total_students": plan.total_students,
                "batch_id": plan.batch_id
            }
            for plan in plans
        ]

    except Exception as e:
        logger.error(f"获取今日备课计划失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.get("/{plan_id}")
async def get_plan_details(
    plan_id: str,
    db: Session = Depends(get_db)
):
    """
    获取备课计划详情
    """
    try:
        plan = db.query(LessonPlan).filter(LessonPlan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="备课计划未找到")

        return {
            "id": str(plan.id),
            "teacher_id": plan.teacher_id,
            "subject": plan.subject,
            "course_progress": plan.course_progress,
            "qc_config": plan.qc_config,
            "special_tasks": plan.special_tasks,
            "is_published": plan.is_published,
            "publish_date": plan.publish_date_date,
            "total_students": plan.total_students,
            "qc_completion_rate": plan.qc_completion_rate,
            "created_at": plan.created_at,
            "updated_at": plan.updated_at
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取备课计划详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.get("/{plan_id}/students")
async def get_plan_students(
    plan_id: str,
    db: Session = Depends(get_db)
):
    """
    获取备课计划的学生记录
    """
    try:
        # 查询学生记录
        records = db.query(StudentRecord).filter(StudentRecord.plan_id == plan_id).all()

        if not records:
            raise HTTPException(status_code=404, detail="该计划暂无学生记录")

        # 按学生分组
        students_records = {}
        for record in records:
            if record.student_id not in students_records:
                student = db.query(Student).filter(Student.id == record.student_id).first()
                students_records[record.student_id] = {
                    "student_id": record.student_id,
                    "student_name": student.name if student else "未知学生",
                    "class_name": student.class_name if student else "",
                    "records": []
                }

            students_records[record.student_id]["records"].append({
                "id": str(record.id),
                "task_name": record.task_name,
                "task_category": record.task_category,
                "status": record.status,
                "exp_value": record.exp_value,
                "is_special": record.is_special,
                "attempt_count": record.attempt_count,
                "completed_at": record.completed_at.isoformat() if record.completed_at else None
            })

        return list(students_records.values())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取备课计划学生记录失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.patch("/{plan_id}/complete")
async def complete_plan(
    plan_id: str,
    student_ids: List[int],
    db: Session = Depends(get_db)
):
    """
    完成备课计划（批量标记学生记录为完成）
    """
    try:
        # 查询计划
        plan = db.query(LessonPlan).filter(LessonPlan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="备课计划未找到")

        # 批量更新学生记录状态
        updated_count = db.query(StudentRecord).filter(
            and_(
                StudentRecord.plan_id == plan_id,
                StudentRecord.student_id.in_(student_ids),
                StudentRecord.status == "pending"
            )
        ).update({
            "status": "completed",
            "completed_at": datetime.utcnow()
        }, synchronize_session=False)

        # 更新计划的完成率
        total_records = db.query(StudentRecord).filter(StudentRecord.plan_id == plan_id).count()
        completed_records = db.query(StudentRecord).filter(
            and_(
                StudentRecord.plan_id == plan_id,
                StudentRecord.status == "completed"
            )
        ).count()

        completion_rate = (completed_records / total_records * 100) if total_records > 0 else 0

        plan.qc_completion_rate = completion_rate
        db.commit()

        return {
            "success": True,
            "updated_count": updated_count,
            "completion_rate": completion_rate,
            "total_records": total_records,
            "completed_records": completed_records
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"完成备课计划失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"完成失败: {str(e)}")


@router.delete("/{plan_id}")
async def delete_plan(
    plan_id: str,
    db: Session = Depends(get_db)
):
    """
    删除备课计划（谨慎使用）
    """
    try:
        # 检查计划是否存在
        plan = db.query(LessonPlan).filter(LessonPlan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="备课计划未找到")

        # 删除相关的学生记录
        db.query(StudentRecord).filter(StudentRecord.plan_id == plan_id).delete()

        # 删除计划
        db.delete(plan)
        db.commit()

        return {
            "success": True,
            "message": "备课计划删除成功"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"删除备课计划失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")