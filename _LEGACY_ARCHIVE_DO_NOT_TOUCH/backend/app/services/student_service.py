"""
学生服务
处理学生相关的业务逻辑
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from backend.app.models import Student, Group


class StudentService:
    def __init__(self, db: Session):
        self.db = db

    async def get_students_by_ids(self, student_ids: List[int]) -> List[Student]:
        """根据ID列表获取学生"""
        return self.db.query(Student).filter(Student.id.in_(student_ids)).all()

    async def get_students_by_teacher(self, teacher_id: str) -> List[Student]:
        """根据教师ID获取学生"""
        return self.db.query(Student).filter(Student.teacher_id == teacher_id).all()

    async def get_students_by_class(self, class_id: int) -> List[Student]:
        """根据班级ID获取学生"""
        return self.db.query(Student).filter(Student.class_id_ref == class_id).all()

    async def get_student_by_name(self, name: str) -> Optional[Student]:
        """根据姓名获取学生"""
        return self.db.query(Student).filter(Student.name == name).first()

    async def convert_names_to_ids(self, student_names: List[str]) -> tuple[List[int], List[str]]:
        """将学生姓名列表转换为ID列表"""
        student_ids = []
        not_found = []

        for name in student_names:
            student = await self.get_student_by_name(name)
            if student:
                student_ids.append(student.id)
            else:
                not_found.append(name)

        return student_ids, not_found

    async def search_students(self, keyword: str, limit: int = 20) -> List[Student]:
        """搜索学生"""
        return self.db.query(Student).filter(
            or_(
                Student.name.ilike(f"%{keyword}%"),
                Student.class_name.ilike(f"%{keyword}%")
            )
        ).limit(limit).all()