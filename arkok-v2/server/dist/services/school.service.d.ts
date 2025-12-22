import { PrismaClient } from '@prisma/client';
export interface SchoolStats {
    teacherCount: number;
    studentCount: number;
    totalPoints: number;
    totalExp: number;
}
export interface SchoolWithStats {
    id: string;
    name: string;
    planType: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    teachers: Array<{
        id: string;
        name: string;
        username: string;
        role: string;
    }>;
    students: Array<{
        id: string;
        name: string;
        className: string;
        level: number;
        points: number;
        exp: number;
    }>;
    stats: SchoolStats;
}
export interface StudentWithStats {
    id: string;
    schoolId: string;
    name: string;
    className: string;
    level: number;
    points: number;
    exp: number;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    school: {
        id: string;
        name: string;
    };
}
export interface CreateSchoolRequest {
    name: string;
    planType: string;
    isActive: boolean;
}
export interface GetStudentsOptions {
    schoolId?: string;
    className?: string;
    limit: number;
}
export declare class SchoolService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 获取学校列表（包含教师和学生统计）
     */
    getSchoolsWithStats(): Promise<SchoolWithStats[]>;
    /**
     * 获取学生列表（按经验值排序）
     */
    getStudentsWithStats(options: GetStudentsOptions): Promise<StudentWithStats[]>;
    /**
     * 创建新学校
     */
    createSchool(request: CreateSchoolRequest): Promise<SchoolWithStats>;
    /**
     * 根据ID获取学校详情
     */
    getSchoolById(schoolId: string): Promise<SchoolWithStats | null>;
}
export default SchoolService;
//# sourceMappingURL=school.service.d.ts.map