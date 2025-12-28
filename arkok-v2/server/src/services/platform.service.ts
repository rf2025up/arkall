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

    /**
     * 更新校区信息（名称、套餐、到期时间）
     */
    async updateCampus(schoolId: string, data: { name?: string; planType?: string; expiredAt?: Date }) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.planType !== undefined) updateData.planType = data.planType;
        if (data.expiredAt !== undefined) updateData.expiredAt = data.expiredAt;

        return this.prisma.schools.update({
            where: { id: schoolId },
            data: updateData
        });
    }

    /**
     * 创建新校区及其管理员账号
     */
    async createCampus(params: {
        name: string;
        adminUsername: string;
        adminName: string;
        planType?: string;
    }) {
        const { name, adminUsername, adminName, planType = 'FREE' } = params;

        // 1. 检查管理员用户名是否已存在
        const existingUser = await this.prisma.teachers.findUnique({
            where: { username: adminUsername }
        });
        if (existingUser) {
            throw new Error('该用户名已被使用');
        }

        // 2. 创建校区
        const school = await this.prisma.schools.create({
            data: {
                name,
                planType: planType as any,
                isActive: true,
                educationalPhilosophy: `欢迎来到${name}！我们致力于为每一位学生提供个性化的教育体验。`
            }
        });

        // 3. 创建校区管理员账号 (初始密码: 0000)
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('0000', 10);

        const admin = await this.prisma.teachers.create({
            data: {
                username: adminUsername,
                password: hashedPassword,
                name: adminName,
                role: 'ADMIN',
                schoolId: school.id
            }
        });

        return {
            school,
            admin: {
                id: admin.id,
                username: admin.username,
                name: admin.name,
                role: admin.role
            }
        };
    }

    /**
     * 全局搜索学生
     */
    async searchStudentsGlobal(query: string, limit: number = 20) {
        return this.prisma.students.findMany({
            where: {
                name: { contains: query }
            },
            include: {
                schools: { select: { name: true } },
                teachers: { select: { name: true } }
            },
            take: limit
        });
    }

    /**
     * 全局搜索教师
     */
    async searchTeachersGlobal(query: string, limit: number = 20) {
        return this.prisma.teachers.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { username: { contains: query } }
                ]
            },
            include: {
                schools: { select: { name: true } }
            },
            take: limit
        });
    }
}

export default PlatformService;
