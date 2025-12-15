"""
进度服务
处理学生个人进度的业务逻辑
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from backend.app.models import Student, LessonPlan, StudentRecord
from backend.app.schemas import CurrentProgress, Subject


class ProgressService:
    def __init__(self, db: Session):
        self.db = db

    async def get_student_progress(self, student_id: int) -> CurrentProgress:
        """
        获取学生当前进度

        优先级：
        1. 学生个人进度 (individual_progress)
        2. 班级最新进度 (lms_lesson_plans)
        """
        # 1. 获取学生信息
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("学生不存在")

        # 2. 检查是否有个人进度覆盖
        if student.individual_progress:
            return CurrentProgress(
                chinese=self._parse_lesson_progress(student.individual_progress.get("chinese")),
                math=self._parse_lesson_progress(student.individual_progress.get("math")),
                english=self._parse_lesson_progress(student.individual_progress.get("english"))
            )

        # 3. 获取班级最新进度
        return await self._get_class_progress(student)

    async def update_student_progress(
        self,
        student_id: int,
        subject: Subject,
        unit: str,
        lesson: Optional[str],
        title: str,
        is_override: bool = True
    ) -> Dict[str, Any]:
        """更新学生个人进度"""
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("学生不存在")

        # 更新个人进度
        if not student.individual_progress:
            student.individual_progress = {}

        lesson_data = {
            "unit": unit,
            "lesson": lesson,
            "title": title,
            "is_override": is_override
        }

        student.individual_progress[subject.value] = lesson_data
        self.db.commit()

        return lesson_data

    async def clear_student_override(self, student_id: int, subject: Optional[Subject] = None):
        """清除学生的个人进度覆盖"""
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("学生不存在")

        if student.individual_progress:
            if subject:
                # 清除特定学科的覆盖
                if subject.value in student.individual_progress:
                    del student.individual_progress[subject.value]
            else:
                # 清除所有学科的覆盖
                student.individual_progress = {}

            self.db.commit()

    async def _get_class_progress(self, student: Student) -> CurrentProgress:
        """获取班级最新进度"""
        progress = CurrentProgress()

        # 获取最新发布的备课计划
        latest_plans = {}
        for subject in [Subject.CHINESE, Subject.MATH, Subject.ENGLISH]:
            latest_plan = self.db.query(LessonPlan).filter(
                and_(
                    LessonPlan.subject == subject.value,
                    LessonPlan.is_published == True,
                    or_(
                        LessonPlan.total_students == 0,
                        # 假设学生都在该计划中，实际应用中可能需要更复杂的逻辑
                        LessonPlan.total_students > 0
                    )
                )
            ).order_by(desc(LessonPlan.publish_date_date)).first()

            if latest_plan:
                progress_dict = latest_plan.course_progress.get(subject.value, {})
                progress_data = self._parse_lesson_progress(progress_dict)
                setattr(progress, subject.value, progress_data)

        return progress

    def _parse_lesson_progress(self, progress_dict: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """解析课程进度字典"""
        if not progress_dict:
            return None

        return {
            "unit": progress_dict.get("unit"),
            "lesson": progress_dict.get("lesson"),
            "title": progress_dict.get("title"),
            "is_override": progress_dict.get("is_override", False)
        }

    async def get_student_academic_map(self, student_id: int) -> Dict[str, Any]:
        """
        获取学生学业地图

        数据源：
        - 个人进度 (students.individual_progress)
        - 班级进度 (lms_lesson_plans)
        - 任务记录 (lms_student_record)
        """
        # 1. 获取学生信息
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("学生不存在")

        # 2. 获取当前进度
        current_progress = await self.get_student_progress(student_id)

        # 3. 获取学业地图数据
        academic_map = []

        # 获取该学生的所有学习记录
        records = self.db.query(StudentRecord).filter(
            StudentRecord.student_id == student_id
        ).all()

        # 按学科和课程组织数据
        subject_lessons = {}

        for record in records:
            if record.lesson_subject not in subject_lessons:
                subject_lessons[record.lesson_subject] = {}

            # 获取对应的备课计划
            lesson_key = f"{record.lesson_unit}_{record.lesson_lesson}_{record.lesson_title}"
            if lesson_key not in subject_lessons[record.lesson_subject]:
                # 查找备课计划
                lesson_plan = self.db.query(LessonPlan).filter(
                    and_(
                        LessonPlan.subject == record.lesson_subject,
                        LessonPlan.unit == record.lesson_unit,
                        LessonPlan.lesson == record.lesson_lesson,
                        LessonPlan.title == record.lesson_title
                    )
                ).first()

                if lesson_plan:
                    subject_lessons[record.lesson_subject][lesson_key] = {
                        "unit": record.lesson_unit,
                        "lesson": record.lesson_lesson,
                        "title": record.lesson_title,
                        "status": "current",  # 默认为当前
                        "qc_items": lesson_plan.qc_config.get(record.lesson_subject, []),
                        "records": []
                    }

            # 添加记录到对应的课程
            if lesson_key in subject_lessons[record.lesson_subject]:
                subject_lessons[record.lesson_subject][lesson_key]["records"].append({
                    "id": str(record.id),
                    "task_name": record.task_name,
                    "task_category": record.task_category,
                    "status": record.status,
                    "exp_value": record.exp_value,
                    "completed_at": record.completed_at
                })

        # 4. 计算每个课程的状态
        for subject, lessons in subject_lessons.items():
            for lesson_key, lesson_data in lessons.items():
                records = lesson_data.get("records", [])

                # 统计QC任务状态
                qc_records = [r for r in records if r["task_category"] == "QC"]
                completed_qc = [r for r in qc_records if r["status"] == "completed"]
                pending_qc = [r for r in qc_records if r["status"] == "pending"]

                # 统计TASK任务状态
                task_records = [r for r in records if r["task_category"] == "TASK"]
                completed_tasks = [r for r in task_records if r["status"] == "completed"]
                pending_tasks = [r for r in task_records if r["status"] == "pending"]

                # 判断课程状态
                if len(completed_qc + completed_tasks) > 0 and len(pending_qc + pending_tasks) == 0:
                    status = "completed"
                    completed_date = max([r.get("completed_at") for r in completed_qc + completed_tasks if r.get("completed_at")])
                elif len(pending_qc + pending_tasks) > 0:
                    status = "current"
                    completed_date = None
                else:
                    status = "pending"
                    completed_date = None

                academic_map.append({
                    "subject": subject,
                    "lessons": [{
                        "unit": lesson_data["unit"],
                        "lesson": lesson_data["lesson"],
                        "title": lesson_data["title"],
                        "status": status,
                        "qc_items": lesson_data.get("qc_items", []),
                        "pending_count": len(pending_qc + pending_tasks),
                        "completed_count": len(completed_qc + completed_tasks),
                        "completed_date": completed_date
                    }]
                })

        # 5. 获取任务历史
        task_history = []
        for record in records:
            if record.status == "completed" and record.completed_at:
                task_history.append({
                    "date": record.completed_at.date(),
                    "category": record.task_category,
                    "task_name": record.task_name,
                    "exp_awarded": record.exp_awarded,
                    "completed_at": record.completed_at
                })

        # 按日期排序
        task_history.sort(key=lambda x: x["completed_at"], reverse=True)

        return {
            "student_info": {
                "id": student.id,
                "name": student.name,
                "class_name": student.class_name,
                "teacher_id": student.teacher_id,
                "current_grade_level": student.current_grade_level
            },
            "current_progress": current_progress,
            "academic_map": academic_map,
            "task_history": task_history
        }