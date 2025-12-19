"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolService = void 0;
const client_1 = require("@prisma/client");
class SchoolService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    /**
     * 获取学校列表（包含教师和学生统计）
     */
    async getSchoolsWithStats() {
        const schools = await this.prisma.schools.findMany({
            include: {
                teachers: {
                    select: { id: true, name: true, username: true, role: true }
                },
                students: {
                    select: { id: true, name: true, className: true, level: true, points: true, exp: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // 计算统计信息
        return schools.map(school => ({
            ...school,
            stats: {
                teacherCount: school.teachers.length,
                studentCount: school.students.length,
                totalPoints: school.students.reduce((sum, student) => sum + student.points, 0),
                totalExp: school.students.reduce((sum, student) => sum + student.exp, 0)
            }
        }));
    }
    /**
     * 获取学生列表（按经验值排序）
     */
    async getStudentsWithStats(options) {
        const { schoolId, className, limit } = options;
        const where = {
            isActive: true
        };
        if (schoolId) {
            where.schoolId = schoolId;
        }
        if (className) {
            where.className = className;
        }
        const students = await this.prisma.students.findMany({
            where,
            select: {
                id: true,
                schoolId: true,
                name: true,
                className: true,
                level: true,
                points: true,
                exp: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                school: {
                    select: { id: true, name: true }
                }
            },
            orderBy: [
                { exp: 'desc' },
                { points: 'desc' },
                { name: 'asc' }
            ],
            take: limit
        });
        return students;
    }
    /**
     * 创建新学校
     */
    async createSchool(request) {
        const { name, planType, isActive } = request;
        const school = await this.prisma.schools.create({
            data: {
                name,
                planType,
                isActive
            },
            include: {
                teachers: {
                    select: { id: true, name: true, username: true, role: true }
                },
                students: {
                    select: { id: true, name: true, className: true, level: true, points: true, exp: true }
                }
            }
        });
        return {
            ...school,
            stats: {
                teacherCount: school.teachers.length,
                studentCount: school.students.length,
                totalPoints: school.students.reduce((sum, student) => sum + student.points, 0),
                totalExp: school.students.reduce((sum, student) => sum + student.exp, 0)
            }
        };
    }
    /**
     * 根据ID获取学校详情
     */
    async getSchoolById(schoolId) {
        const school = await this.prisma.schools.findUnique({
            where: { id: schoolId },
            include: {
                teachers: {
                    select: { id: true, name: true, username: true, role: true }
                },
                students: {
                    select: { id: true, name: true, className: true, level: true, points: true, exp: true }
                }
            }
        });
        if (!school) {
            return null;
        }
        return {
            ...school,
            stats: {
                teacherCount: school.teachers.length,
                studentCount: school.students.length,
                totalPoints: school.students.reduce((sum, student) => sum + student.points, 0),
                totalExp: school.students.reduce((sum, student) => sum + student.exp, 0)
            }
        };
    }
}
exports.SchoolService = SchoolService;
exports.default = SchoolService;
//# sourceMappingURL=school.service.js.map