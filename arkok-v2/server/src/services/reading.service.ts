import prisma from '../utils/prisma';

/**
 * 阅读计划服务
 * 管理学生的阅读书籍和阅读记录
 */
export class ReadingService {

    /**
     * 获取学生的阅读书籍列表（含最新进度）
     */
    async getStudentBooks(studentId: string, schoolId: string) {
        const books = await prisma.reading_books.findMany({
            where: {
                studentId,
                schoolId,
                isActive: true
            },
            include: {
                logs: {
                    orderBy: { recordedAt: 'desc' },
                    take: 1,
                    select: {
                        currentPage: true,
                        duration: true,
                        recordedAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return books.map(book => ({
            id: book.id,
            bookName: book.bookName,
            totalPages: book.totalPages,
            currentPage: book.logs[0]?.currentPage || 0,
            lastReadAt: book.logs[0]?.recordedAt || null,
            createdAt: book.createdAt
        }));
    }

    /**
     * 新增书籍
     */
    async addBook(data: { studentId: string; schoolId: string; bookName: string; totalPages?: number }) {
        const { studentId, schoolId, bookName, totalPages } = data;

        const book = await prisma.reading_books.create({
            data: {
                studentId,
                schoolId,
                bookName,
                totalPages
            }
        });

        return book;
    }

    /**
     * 删除书籍（软删除）
     */
    async deleteBook(bookId: string, schoolId: string) {
        await prisma.reading_books.update({
            where: { id: bookId },
            data: { isActive: false }
        });
    }

    /**
     * 记录阅读进度
     */
    async addReadingLog(data: {
        bookId: string;
        studentId: string;
        schoolId: string;
        currentPage: number;
        duration: number;
        recordedBy?: string;
    }) {
        const { bookId, studentId, schoolId, currentPage, duration, recordedBy } = data;

        const log = await prisma.reading_logs.create({
            data: {
                bookId,
                studentId,
                schoolId,
                currentPage,
                duration,
                recordedBy
            },
            include: {
                books: {
                    select: { bookName: true, totalPages: true }
                }
            }
        });

        return {
            id: log.id,
            bookName: log.books.bookName,
            totalPages: log.books.totalPages,
            currentPage: log.currentPage,
            duration: log.duration,
            recordedAt: log.recordedAt
        };
    }

    /**
     * 获取学生阅读统计
     */
    async getStudentReadingStats(studentId: string, schoolId: string) {
        // 获取所有阅读记录
        const logs = await prisma.reading_logs.findMany({
            where: { studentId, schoolId },
            select: {
                currentPage: true,
                duration: true,
                recordedAt: true,
                books: {
                    select: { id: true, bookName: true, totalPages: true }
                }
            }
        });

        // 按书籍分组计算进度
        const bookProgress: Record<string, { bookName: string; totalPages: number | null; currentPage: number }> = {};
        let totalDuration = 0;

        logs.forEach(log => {
            const bookId = log.books.id;
            if (!bookProgress[bookId]) {
                bookProgress[bookId] = {
                    bookName: log.books.bookName,
                    totalPages: log.books.totalPages,
                    currentPage: 0
                };
            }
            // 取最大页码作为当前进度
            if (log.currentPage > bookProgress[bookId].currentPage) {
                bookProgress[bookId].currentPage = log.currentPage;
            }
            totalDuration += log.duration;
        });

        // 计算总阅读页数
        const totalPages = Object.values(bookProgress).reduce((sum, book) => sum + book.currentPage, 0);

        return {
            totalPages,
            totalDuration,
            totalDurationHours: parseFloat((totalDuration / 60).toFixed(1)),
            booksCount: Object.keys(bookProgress).length,
            books: Object.entries(bookProgress).map(([id, book]) => ({
                id,
                ...book,
                progress: book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : null
            }))
        };
    }

    /**
     * 获取学生今日阅读记录（用于家长端公告）
     */
    async getTodayReadingLogs(studentId: string, schoolId: string) {
        // 获取今日时间范围（北京时间）
        const now = new Date();
        const beijingOffset = 8 * 60;
        const localOffset = now.getTimezoneOffset();
        const beijingTime = new Date(now.getTime() + (beijingOffset + localOffset) * 60 * 1000);
        const todayStr = beijingTime.toISOString().split('T')[0];
        const today = new Date(`${todayStr}T00:00:00+08:00`);
        const tomorrow = new Date(`${todayStr}T23:59:59+08:00`);

        const logs = await prisma.reading_logs.findMany({
            where: {
                studentId,
                schoolId,
                recordedAt: { gte: today, lt: tomorrow }
            },
            include: {
                books: {
                    select: { bookName: true, totalPages: true }
                }
            },
            orderBy: { recordedAt: 'desc' }
        });

        return logs.map(log => ({
            id: log.id,
            bookName: log.books.bookName,
            totalPages: log.books.totalPages,
            currentPage: log.currentPage,
            duration: log.duration,
            recordedAt: log.recordedAt
        }));
    }

    /**
     * 获取学生最近选择的书籍（用于默认显示）
     */
    async getLastSelectedBook(studentId: string, schoolId: string) {
        const lastLog = await prisma.reading_logs.findFirst({
            where: { studentId, schoolId },
            orderBy: { recordedAt: 'desc' },
            include: {
                books: {
                    select: { id: true, bookName: true, totalPages: true }
                }
            }
        });

        if (!lastLog) return null;

        return {
            bookId: lastLog.books.id,
            bookName: lastLog.books.bookName,
            totalPages: lastLog.books.totalPages,
            currentPage: lastLog.currentPage
        };
    }
}

export const readingService = new ReadingService();
