import { PrismaClient } from '@prisma/client';

export interface GlobalStats {
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
    activeSchools: number;
    totalTaskRecords: number;
}

export class PlatformService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * 获取全球（全平台）概览数据
     */
    async getGlobalOverview(): Promise<GlobalStats> {
        const [
            totalSchools,
            totalStudents,
            totalTeachers,
            activeSchools,
            totalTaskRecords
        ] = await Promise.all([
            this.prisma.schools.count(),
            this.prisma.students.count(),
            this.prisma.teachers.count(),
            this.prisma.schools.count({ where: { isActive: true } }),
            this.prisma.task_records.count()
        ]);

        return {
            totalSchools,
            totalStudents,
            totalTeachers,
            activeSchools,
            totalTaskRecords
        };
    }

    /**
     * 获取所有校区列表及其基础统计
     */
    async listAllCampuses() {
        const schools = await this.prisma.schools.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        students: true,
                        teachers: true
                    }
                }
            }
        });

        return schools.map(school => ({
            ...school,
            studentCount: school._count.students,
            teacherCount: school._count.teachers
        }));
    }

    /**
     * 切换校区激活状态
     */
    async toggleCampusStatus(schoolId: string, isActive: boolean) {
        return this.prisma.schools.update({
            where: { id: schoolId },
            data: { isActive }
        });
    }

    /**
     * 更新校区服务到期时间
     */
    async updateCampusExpiry(schoolId: string, expiredAt: Date) {
        return this.prisma.schools.update({
            where: { id: schoolId },
            data: { expiredAt }
        });
    }
}

export default PlatformService;
