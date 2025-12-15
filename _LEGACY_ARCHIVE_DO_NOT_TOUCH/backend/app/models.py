"""
SQLAlchemy Models for StarJourney LMS System
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Date, UUID
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()


class Student(Base):
    __tablename__ = 'students'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    score = Column(Integer, default=0)
    avatar_url = Column(String(500))
    total_exp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    team_id = Column(Integer, ForeignKey('teams.id'))
    group_id = Column(Integer, ForeignKey('groups.id'))
    class_name = Column(String(50), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 新增字段 - LMS支持
    individual_progress = Column(JSONB, default=dict())
    teacher_id = Column(String(100), default='default_teacher', index=True)
    class_id_ref = Column(Integer, ForeignKey('groups.id'), name='class_id')  # 避免与SQL关键字冲突
    current_grade_level = Column(Integer, default=3)
    daily_task_count = Column(Integer, default=0)
    daily_completed_count = Column(Integer, default=0)

    # Relationships
    team = relationship("Team", back_populates="students")
    group = relationship("Group", back_populates="students")
    student_records = relationship("StudentRecord", back_populates="student")
    lesson_plans = relationship("LessonPlan", back_populates="students")

    def __repr__(self):
        return f"<Student(id={self.id}, name='{self.name}', class='{self.class_name}')>"


class Team(Base):
    __tablename__ = 'teams'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(7), default='#667eea')
    text_color = Column(String(7), default='#00d4ff')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    students = relationship("Student", back_populates="team")


class Group(Base):
    __tablename__ = 'groups'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    display_order = Column(Integer, nullable=False, default=0)
    color = Column(String(7), default='#667eea')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    students = relationship("Student", back_populates="group")


class LessonPlan(Base):
    __tablename__ = 'lms_lesson_plans'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    teacher_id = Column(String(100), nullable=False, index=True)
    subject = Column(String(50), nullable=False, index=True)
    unit = Column(Integer, nullable=False)
    lesson = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)

    # 原有字段
    qc_items = Column(ARRAY(Text))  # 保持向后兼容
    task_items = Column(ARRAY(Text))  # 保持向后兼容
    special_tasks = Column(JSONB, default=list)
    is_published = Column(Boolean, default=False, index=True)
    publish_date = Column(DateTime(timezone=True))
    total_students = Column(Integer, default=0)
    qc_completion_rate = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 新增字段 - v13.0 Ultimate UI支持
    course_progress = Column(JSONB, default=dict())
    qc_config = Column(JSONB, default=dict())
    publish_date_date = Column(Date, default=func.current_date(), index=True)  # 日期版本
    batch_id = Column(String(100), index=True)

    # Constraints
    __table_args__ = (
        UniqueConstraint('teacher_id', 'subject', 'unit', 'lesson', name='unique_lesson_plan'),
    )

    # Relationships
    student_records = relationship("StudentRecord", back_populates="lesson_plan")

    def __repr__(self):
        return f"<LessonPlan(id={self.id}, subject='{self.subject}', unit={self.unit}, lesson={self.lesson})>"


class TaskLibrary(Base):
    __tablename__ = 'lms_task_library'

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    default_exp = Column(Integer, default=10)
    is_active = Column(Boolean, default=True, index=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<TaskLibrary(id={self.id}, category='{self.category}', name='{self.name}')>"


class StudentRecord(Base):
    __tablename__ = 'lms_student_record'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey('lms_lesson_plans.id'), index=True)
    task_name = Column(String(200), nullable=False)
    task_type = Column(String(20), default='TASK')  # 保持向后兼容
    status = Column(String(20), default='pending')  # pending, passed, completed
    exp_value = Column(Integer, default=10)
    attempt_count = Column(Integer, default=0)
    difficulty_flag = Column(Boolean, default=False)
    first_attempt_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 课程进度信息
    lesson_unit = Column(Integer)
    lesson_lesson = Column(Integer)
    lesson_title = Column(String(200))
    lesson_subject = Column(String(50))

    # 新增字段 - v13.0 Ultimate UI支持
    task_category = Column(String(20), default='TASK', index=True, check="task_category IN ('QC', 'TASK', 'SPECIAL')")
    exp_awarded = Column(Integer, default=0)
    is_special = Column(Boolean, default=False, index=True)
    batch_id = Column(String(100), index=True)

    # Relationships
    student = relationship("Student", back_populates="student_records")
    lesson_plan = relationship("LessonPlan", back_populates="student_records")

    def __repr__(self):
        return f"<StudentRecord(id={self.id}, student_id={self.student_id}, task_name='{self.task_name}', category='{self.task_category}')>"


class AcademicReport(Base):
    __tablename__ = 'lms_academic_reports'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False, index=True)
    report_type = Column(String(20), nullable=False)  # weekly, monthly, custom
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    radar_data = Column(JSONB, nullable=False)
    ai_comment = Column(Text)
    total_mistakes = Column(Integer, default=0)
    weak_points = Column(JSONB)
    action_plan = Column(ARRAY(Text))
    pdf_url = Column(String(500))
    html_content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 新增字段 - 统计支持
    daily_stats = Column(JSONB, default=dict())
    weekly_stats = Column(JSONB, default=dict())
    monthly_stats = Column(JSONB, default=dict())
    task_completion_rate = Column(Float, default=0.0)
    progress_summary = Column(JSONB, default=dict())
    personalized_insights = Column(ARRAY(Text))
    auto_generated = Column(Boolean, default=False)

    # Constraints
    __table_args__ = (
        UniqueConstraint('student_id', 'report_type', 'start_date', 'end_date', name='unique_student_report_period'),
    )

    def __repr__(self):
        return f"<AcademicReport(id={self.id}, student_id={self.student_id}, type='{self.report_type}')>"


class Mistake(Base):
    __tablename__ = 'lms_mistakes'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False, index=True)
    image_url = Column(String(500))
    ocr_text = Column(Text)
    ai_analysis = Column(JSONB)
    subject = Column(String(50), default='math', index=True)
    status = Column(String(20), default='pending', index=True)  # pending, solved, reviewed
    tags = Column(ARRAY(String))
    difficulty_level = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("Student")

    def __repr__(self):
        return f"<Mistake(id={self.id}, student_id={self.student_id}, subject='{self.subject}', status='{self.status}')>"


# 辅助模型
class PublishBatch(Base):
    __tablename__ = 'lms_publish_batches'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4())
    teacher_id = Column(String(100), nullable=False)
    publish_date = Column(Date, default=func.current_date(), index=True)
    total_plans = Column(Integer, default=0)
    total_students = Column(Integer, default=0)
    total_records = Column(Integer, default=0)
    status = Column(String(20), default='draft')  # draft, published, failed
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<PublishBatch(id={self.id}, teacher_id='{self.teacher_id}', date='{self.publish_date}', status='{self.status}')>"


# 数据库初始化函数
def create_tables(engine):
    """创建所有表"""
    Base.metadata.create_all(bind=engine)


# 数据库连接配置
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    engine = create_engine(DATABASE_URL)
else:
    # 开发环境配置
    engine = create_engine(
        "postgresql://postgres:password@localhost:5432/starjourney",
        echo=True  # 开发环境显示SQL
    )