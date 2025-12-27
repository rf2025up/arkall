import { PrismaClient } from '@prisma/client';
export interface GlobalStats {
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
    activeSchools: number;
    totalTaskRecords: number;
}
export declare class PlatformService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 获取全球（全平台）概览数据
     */
    getGlobalOverview(): Promise<GlobalStats>;
    /**
     * 获取所有校区列表及其基础统计
     */
    listAllCampuses(): Promise<{
        studentCount: number;
        teacherCount: number;
        _count: {
            teachers: number;
            students: number;
        };
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        planType: import(".prisma/client").$Enums.PlanType;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        educationalPhilosophy: string;
        expiredAt: Date | null;
    }[]>;
    /**
     * 切换校区激活状态
     */
    toggleCampusStatus(schoolId: string, isActive: boolean): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        planType: import(".prisma/client").$Enums.PlanType;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        educationalPhilosophy: string;
        expiredAt: Date | null;
    }>;
    /**
     * 更新校区服务到期时间
     */
    updateCampusExpiry(schoolId: string, expiredAt: Date): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        planType: import(".prisma/client").$Enums.PlanType;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        educationalPhilosophy: string;
        expiredAt: Date | null;
    }>;
    /**
     * 创建新校区及其管理员账号
     */
    createCampus(params: {
        name: string;
        adminUsername: string;
        adminName: string;
        planType?: string;
    }): Promise<{
        school: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            planType: import(".prisma/client").$Enums.PlanType;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            educationalPhilosophy: string;
            expiredAt: Date | null;
        };
        admin: {
            id: string;
            username: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    /**
     * 全局搜索学生
     */
    searchStudentsGlobal(query: string, limit?: number): Promise<({
        teachers: {
            name: string;
        };
        schools: {
            name: string;
        };
    } & {
        id: string;
        schoolId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        teacherId: string | null;
        className: string | null;
        level: number;
        points: number;
        exp: number;
        avatarUrl: string | null;
        deletedAt: Date | null;
        teamId: string | null;
        currentLesson: string | null;
        currentLessonTitle: string | null;
        currentUnit: string | null;
        currentInviteCode: string | null;
        inviteCodeExpiresAt: Date | null;
    })[]>;
    /**
     * 全局搜索教师
     */
    searchTeachersGlobal(query: string, limit?: number): Promise<({
        schools: {
            name: string;
        };
    } & {
        username: string;
        password: string;
        id: string;
        schoolId: string;
        name: string;
        email: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
        displayName: string | null;
        primaryClassName: string | null;
    })[]>;
}
export default PlatformService;
//# sourceMappingURL=platform.service.d.ts.map