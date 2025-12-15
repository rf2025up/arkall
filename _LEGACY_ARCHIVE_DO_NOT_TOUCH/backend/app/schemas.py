"""
Pydantic Schemas for StarJourney LMS System
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from enum import Enum


class TaskCategory(str, Enum):
    """任务分类枚举"""
    QC = "QC"
    TASK = "TASK"
    SPECIAL = "SPECIAL"


class TaskStatus(str, Enum):
    """任务状态枚举"""
    PENDING = "pending"
    PASSED = "passed"
    COMPLETED = "completed"


class Subject(str, Enum):
    """学科枚举"""
    CHINESE = "chinese"
    MATH = "math"
    ENGLISH = "english"


# ==================== 基础数据结构 ====================

class LessonInput(BaseModel):
    """课程进度输入结构"""
    unit: str = Field(..., description="单元号")
    lesson: Optional[str] = Field(None, description="课次，英语可能没有")
    title: str = Field(..., description="课程标题")

    @validator('unit')
    def validate_unit(cls, v):
        if not v.isdigit():
            raise ValueError('unit必须是数字字符串')
        return v

    @validator('lesson')
    def validate_lesson(cls, v):
        if v is not None and not v.isdigit():
            raise ValueError('lesson必须是数字字符串')
        return v


class CourseInfo(BaseModel):
    """课程信息结构 - 三科差异化"""
    chinese: LessonInput
    math: LessonInput
    english: LessonInput

    class Config:
        schema_extra = {
            "example": {
                "chinese": {"unit": "3", "lesson": "2", "title": "古诗二首"},
                "math": {"unit": "4", "lesson": "1", "title": "除法"},
                "english": {"unit": "2", "title": "Hello World"}
            }
        }


class SpecialTaskItem(BaseModel):
    """个性化加餐任务"""
    id: Optional[int] = Field(None, description="任务ID，前端使用")
    students: List[str] = Field(..., description="学生姓名列表")
    tasks: List[str] = Field(..., description="任务名称列表")

    @validator('students')
    def validate_students(cls, v):
        if len(v) == 0:
            raise ValueError('学生列表不能为空')
        return v

    @validator('tasks')
    def validate_tasks(cls, v):
        if len(v) == 0:
            raise ValueError('任务列表不能为空')
        return v


class TaskLibraryItem(BaseModel):
    """任务库项目"""
    category: str = Field(..., description="任务类别")
    name: str = Field(..., description="任务名称")
    default_exp: int = Field(10, description="默认经验值")
    is_active: bool = Field(True, description="是否启用")
    sort_order: int = Field(0, description="排序顺序")

    class Config:
        schema_extra = {
            "example": {
                "category": "一、基础学习(核心)",
                "name": "完成数学书面作业",
                "default_exp": 15,
                "is_active": True,
                "sort_order": 1
            }
        }


# ==================== 请求Schema ====================

class PlanPublishRequest(BaseModel):
    """发布备课计划请求"""
    publish_date: str = Field(..., description="发布日期，格式：YYYY-MM-DD")
    course_info: CourseInfo = Field(..., description="课程进度信息")
    qc_items: Dict[str, List[str]] = Field(..., description="过关项配置，按学科分组")
    tasks: List[str] = Field(..., description="普通任务列表")
    special_tasks: List[SpecialTaskItem] = Field(..., description="个性化加餐任务列表")
    teacher_id: str = Field(..., description="教师ID")
    target_student_ids: Optional[List[int]] = Field(None, description="目标学生ID列表，空表示全体学生")

    @validator('publish_date')
    def validate_publish_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('publish_date格式必须为YYYY-MM-DD')
        return v

    @validator('qc_items')
    def validate_qc_items(cls, v):
        required_subjects = ['chinese', 'math', 'english']
        for subject in required_subjects:
            if subject not in v:
                v[subject] = []  # 设置默认空列表
        return v

    @validator('tasks')
    def validate_tasks(cls, v):
        if len(v) == 0:
            raise ValueError('至少需要选择一个任务')
        return v

    class Config:
        schema_extra = {
            "example": {
                "publish_date": "2025-12-11",
                "course_info": {
                    "chinese": {"unit": "3", "lesson": "2", "title": "古诗二首"},
                    "math": {"unit": "4", "lesson": "1", "title": "除法"},
                    "english": {"unit": "2", "title": "Hello World"}
                },
                "qc_items": {
                    "chinese": ["生字听写", "课文背诵"],
                    "math": ["口算达标", "竖式计算"],
                    "english": ["单词默写"]
                },
                "tasks": ["完成数学书面作业", "课外阅读30分钟"],
                "special_tasks": [
                    {
                        "students": ["张小明", "李小花"],
                        "tasks": ["罚抄错题", "朗读课文"]
                    }
                ],
                "teacher_id": "teacher_001",
                "target_student_ids": [1, 2, 3, 4, 5]
            }
        }


class StudentProgressUpdate(BaseModel):
    """学生个人进度更新请求"""
    subject: Subject = Field(..., description="学科")
    unit: str = Field(..., description="单元")
    lesson: Optional[str] = Field(None, description="课次")
    title: str = Field(..., description="课程标题")
    is_override: bool = Field(True, description="是否覆盖全班进度")

    @validator('unit')
    def validate_unit(cls, v):
        if not v.isdigit():
            raise ValueError('unit必须是数字字符串')
        return v


# ==================== 响应Schema ====================

class BaseResponse(BaseModel):
    """基础响应结构"""
    success: bool
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TaskLibraryResponse(BaseResponse):
    """任务库响应"""
    data: List[TaskLibraryItem] = []


class PublishPlanResponseData(BaseModel):
    """发布计划响应数据"""
    plan_id: UUID = Field(..., description="备课计划ID")
    batch_id: str = Field(..., description="批次ID")
    created_records: int = Field(..., description="创建的记录总数")
    affected_students: int = Field(..., description="影响的学生数量")
    special_task_count: int = Field(..., description="个性化任务数量")
    estimated_total_exp: int = Field(..., description="预估总经验值")


class PublishPlanResponse(BaseResponse):
    """发布计划响应"""
    data: PublishPlanResponseData


class LessonProgressItem(BaseModel):
    """课程进度项目"""
    unit: str
    lesson: Optional[str]
    title: str
    is_override: bool = Field(False, description="是否为个人覆盖进度")


class CurrentProgress(BaseModel):
    """当前进度结构"""
    chinese: Optional[LessonProgressItem] = None
    math: Optional[LessonProgressItem] = None
    english: Optional[LessonProgressItem] = None


class AcademicMapLesson(BaseModel):
    """学业地图中的课程"""
    unit: int
    lesson: int
    title: str
    status: str = Field(..., description="completed, current, pending")
    qc_items: List[str] = Field(default_factory=list)
    pending_count: int = Field(0, description="待完成数量")
    completed_count: int = Field(0, description="已完成数量")
    completed_date: Optional[date] = None


class AcademicMapSubject(BaseModel):
    """学业地图中的学科"""
    subject: Subject
    lessons: List[AcademicMapLesson]


class TaskHistoryItem(BaseModel):
    """任务历史项目"""
    date: date
    category: TaskCategory
    task_name: str
    exp_awarded: int
    completed_at: datetime


class StudentInfo(BaseModel):
    """学生信息"""
    id: int
    name: str
    class_name: str
    teacher_id: str
    current_grade_level: int


class AcademicMapResponseData(BaseModel):
    """学业地图响应数据"""
    student_info: StudentInfo
    current_progress: CurrentProgress
    academic_map: List[AcademicMapSubject]
    task_history: List[TaskHistoryItem]


class AcademicMapResponse(BaseResponse):
    """学业地图响应"""
    data: AcademicMapResponseData


class StudentProgressResponse(BaseModel):
    """学生进度响应"""
    data: CurrentProgress


class BatchSettleRequest(BaseModel):
    """批量结算请求"""
    date: str = Field(..., description="结算日期，格式：YYYY-MM-DD")
    student_ids: Optional[List[int]] = Field(None, description="学生ID列表，空表示全体")
    include_only_completed: bool = Field(True, description="仅结算已完成的任务")


class SettlementStatistics(BaseModel):
    """结算统计"""
    student_id: int
    student_name: str
    pending_records_count: int
    total_exp: int
    total_points: int
    customized_exp: int = 0
    has_customizations: bool = False


class BatchSettleResponseData(BaseModel):
    """批量结算响应数据"""
    settlement_batch: str = Field(..., description="结算批次ID")
    total_students: int
    settled_students: int
    total_records: int
    settled_records: int
    total_exp_awarded: int
    total_points_awarded: int
    statistics: List[SettlementStatistics]


class BatchSettleResponse(BaseResponse):
    """批量结算响应"""
    data: BatchSettleResponseData


# ==================== 数据库Schema ====================

class LessonPlanBase(BaseModel):
    """备课计划基础Schema"""
    id: UUID
    teacher_id: str
    subject: str
    unit: int
    lesson: int
    title: str
    course_progress: Dict[str, Any] = Field(default_factory=dict)
    qc_config: Dict[str, Any] = Field(default_factory=dict)
    is_published: bool = False
    publish_date_date: date
    batch_id: Optional[str] = None
    total_students: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentRecordBase(BaseModel):
    """学生记录基础Schema"""
    id: UUID
    student_id: int
    plan_id: Optional[UUID]
    task_name: str
    task_category: TaskCategory
    status: TaskStatus
    exp_value: int = 10
    exp_awarded: int = 0
    is_special: bool = False
    attempt_count: int = 0
    lesson_unit: Optional[int] = None
    lesson_lesson: Optional[int] = None
    lesson_title: Optional[str] = None
    lesson_subject: Optional[str] = None
    completed_at: Optional[datetime] = None
    batch_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentBase(BaseModel):
    """学生基础Schema"""
    id: int
    name: str
    score: int = 0
    total_exp: int = 0
    level: int = 1
    class_name: Optional[str] = None
    avatar_url: Optional[str] = None
    individual_progress: Dict[str, Any] = Field(default_factory=dict)
    teacher_id: str = "default_teacher"
    current_grade_level: int = 3
    daily_task_count: int = 0
    daily_completed_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskLibraryBase(BaseModel):
    """任务库基础Schema"""
    id: int
    category: str
    name: str
    default_exp: int = 10
    is_active: bool = True
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True