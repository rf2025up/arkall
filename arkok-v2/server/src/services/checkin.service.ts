import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CheckinResult {
    studentId: string;
    success: boolean;
    message?: string;
}

export class CheckinService {
    /**
     * 批量签到
     */
    async batchCheckin(params: {
        studentIds: string[];
        schoolId: string;
        checkedBy: string;
    }): Promise<{ success: CheckinResult[]; failed: CheckinResult[]; date: string }> {
        const { studentIds, schoolId, checkedBy } = params;

        // 获取今天日期（北京时间）
        const today = new Date();
        today.setHours(today.getHours() + 8);
        const checkinDate = today.toISOString().split('T')[0];

        const success: CheckinResult[] = [];
        const failed: CheckinResult[] = [];

        for (const studentId of studentIds) {
            try {
                // 检查今天是否已签到
                const existing = await prisma.student_checkins.findUnique({
                    where: {
                        studentId_checkinDate: {
                            studentId,
                            checkinDate
                        }
                    }
                });

                if (existing) {
                    failed.push({
                        studentId,
                        success: false,
                        message: '今日已签到'
                    });
                    continue;
                }

                // 创建签到记录
                await prisma.student_checkins.create({
                    data: {
                        studentId,
                        schoolId,
                        checkinDate,
                        checkedBy
                    }
                });

                success.push({
                    studentId,
                    success: true
                });
            } catch (error) {
                console.error(`Checkin failed for student ${studentId}:`, error);
                failed.push({
                    studentId,
                    success: false,
                    message: '签到失败'
                });
            }
        }

        return { success, failed, date: checkinDate };
    }

    /**
     * 获取学生本月签到天数
     */
    async getMonthlyCheckinCount(studentId: string): Promise<number> {
        // 获取本月第一天和最后一天（北京时间）
        const now = new Date();
        now.setHours(now.getHours() + 8);
        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-31`;

        const count = await prisma.student_checkins.count({
            where: {
                studentId,
                checkinDate: {
                    gte: firstDay,
                    lte: lastDay
                }
            }
        });

        return count;
    }

    /**
     * 获取学生今日是否已签到
     */
    async isTodayCheckedIn(studentId: string): Promise<boolean> {
        const today = new Date();
        today.setHours(today.getHours() + 8);
        const checkinDate = today.toISOString().split('T')[0];

        const checkin = await prisma.student_checkins.findUnique({
            where: {
                studentId_checkinDate: {
                    studentId,
                    checkinDate
                }
            }
        });

        return !!checkin;
    }
}

export default new CheckinService();
