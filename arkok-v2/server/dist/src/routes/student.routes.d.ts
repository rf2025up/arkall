import { Router } from 'express';
import { StudentService } from '../services/student.service';
import AuthService from '../services/auth.service';
/**
 * 学生管理路由
 */
export declare class StudentRoutes {
    private studentService;
    private router;
    private authService;
    constructor(studentService: StudentService, authService: AuthService);
    private initializeRoutes;
    /**
     * 获取学生列表 - 强制重写修复
     */
    private getStudents;
    /**
     * 获取单个学生详情
     */
    private getStudentById;
    /**
     * 获取学生完整档案（聚合所有相关数据）
     */
    private getStudentProfile;
    /**
     * 创建新学生 - 强制重写修复
     */
    private createStudent;
    /**
     * 更新学生信息
     */
    private updateStudent;
    /**
     * 删除学生（软删除）
     */
    private deleteStudent;
    /**
     * 🆕 师生关系转移 - 从"转班"升级为"抢人"
     */
    private transferStudents;
    /**
     * 批量添加积分/经验
     */
    private addScore;
    /**
     * 获取学生排行榜
     */
    private getLeaderboard;
    /**
     * 获取班级统计
     */
    private getClassStats;
    /**
     * 获取班级列表（用于班级切换）
     */
    private getClasses;
    /**
     * 获取路由器实例
     */
    getRoutes(): Router;
}
export default StudentRoutes;
//# sourceMappingURL=student.routes.d.ts.map