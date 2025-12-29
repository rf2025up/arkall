import { Router, Request, Response } from 'express';
import { readingService } from '../services/reading.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';

/**
 * 阅读计划路由
 */
export class ReadingRoutes {
    private router: Router;
    private authService: AuthService;

    constructor(authService: AuthService) {
        this.router = Router();
        this.authService = authService;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // 所有路由都需要认证
        this.router.use(authenticateToken(this.authService));

        // 获取学生的阅读书籍列表
        this.router.get('/books/:studentId', this.getStudentBooks.bind(this));

        // 新增书籍
        this.router.post('/books', this.addBook.bind(this));

        // 删除书籍
        this.router.delete('/books/:bookId', this.deleteBook.bind(this));

        // 记录阅读进度
        this.router.post('/logs', this.addReadingLog.bind(this));

        // 获取学生阅读统计
        this.router.get('/stats/:studentId', this.getReadingStats.bind(this));

        // 获取最近选择的书籍
        this.router.get('/last-book/:studentId', this.getLastSelectedBook.bind(this));
    }

    /**
     * 获取学生的阅读书籍列表
     */
    private async getStudentBooks(req: Request, res: Response): Promise<void> {
        try {
            const { studentId } = req.params;
            const schoolId = req.schoolId!;

            const books = await readingService.getStudentBooks(studentId, schoolId);

            res.status(200).json({
                success: true,
                data: books
            });
        } catch (error) {
            console.error('Get student books error:', error);
            res.status(500).json({
                success: false,
                message: '获取阅读书籍失败'
            });
        }
    }

    /**
     * 新增书籍
     */
    private async addBook(req: Request, res: Response): Promise<void> {
        try {
            const { studentId, bookName, totalPages } = req.body;
            const schoolId = req.schoolId!;

            if (!studentId || !bookName) {
                res.status(400).json({
                    success: false,
                    message: '缺少必要参数'
                });
                return;
            }

            const book = await readingService.addBook({
                studentId,
                schoolId,
                bookName,
                totalPages
            });

            res.status(201).json({
                success: true,
                message: '书籍添加成功',
                data: book
            });
        } catch (error) {
            console.error('Add book error:', error);
            res.status(500).json({
                success: false,
                message: '添加书籍失败'
            });
        }
    }

    /**
     * 删除书籍
     */
    private async deleteBook(req: Request, res: Response): Promise<void> {
        try {
            const { bookId } = req.params;
            const schoolId = req.schoolId!;

            await readingService.deleteBook(bookId, schoolId);

            res.status(200).json({
                success: true,
                message: '书籍删除成功'
            });
        } catch (error) {
            console.error('Delete book error:', error);
            res.status(500).json({
                success: false,
                message: '删除书籍失败'
            });
        }
    }

    /**
     * 记录阅读进度
     */
    private async addReadingLog(req: Request, res: Response): Promise<void> {
        try {
            const { bookId, studentId, currentPage, duration } = req.body;
            const schoolId = req.schoolId!;
            const recordedBy = req.user?.username;

            if (!bookId || !studentId || currentPage === undefined || duration === undefined) {
                res.status(400).json({
                    success: false,
                    message: '缺少必要参数'
                });
                return;
            }

            const log = await readingService.addReadingLog({
                bookId,
                studentId,
                schoolId,
                currentPage: parseInt(currentPage),
                duration: parseInt(duration),
                recordedBy
            });

            res.status(201).json({
                success: true,
                message: '阅读记录添加成功',
                data: log
            });
        } catch (error) {
            console.error('Add reading log error:', error);
            res.status(500).json({
                success: false,
                message: '添加阅读记录失败'
            });
        }
    }

    /**
     * 获取学生阅读统计
     */
    private async getReadingStats(req: Request, res: Response): Promise<void> {
        try {
            const { studentId } = req.params;
            const schoolId = req.schoolId!;

            const stats = await readingService.getStudentReadingStats(studentId, schoolId);

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get reading stats error:', error);
            res.status(500).json({
                success: false,
                message: '获取阅读统计失败'
            });
        }
    }

    /**
     * 获取最近选择的书籍
     */
    private async getLastSelectedBook(req: Request, res: Response): Promise<void> {
        try {
            const { studentId } = req.params;
            const schoolId = req.schoolId!;

            const lastBook = await readingService.getLastSelectedBook(studentId, schoolId);

            res.status(200).json({
                success: true,
                data: lastBook
            });
        } catch (error) {
            console.error('Get last selected book error:', error);
            res.status(500).json({
                success: false,
                message: '获取最近书籍失败'
            });
        }
    }

    public getRoutes(): Router {
        return this.router;
    }
}

export default ReadingRoutes;
