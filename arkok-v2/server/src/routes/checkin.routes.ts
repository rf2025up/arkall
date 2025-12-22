import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest, validateUser } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';
import checkinService from '../services/checkin.service';

export class CheckinRoutes {
    private router: Router;

    constructor(private authService: AuthService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // 批量签到
        this.router.post('/batch', authenticateToken(this.authService), validateUser, this.batchCheckin.bind(this));

        // 获取学生本月签到天数
        this.router.get('/student/:studentId/monthly', authenticateToken(this.authService), validateUser, this.getMonthlyCheckinCount.bind(this));

        // 检查学生今日是否已签到
        this.router.get('/student/:studentId/today', authenticateToken(this.authService), validateUser, this.isTodayCheckedIn.bind(this));
    }

    /**
     * 批量签到
     */
    private async batchCheckin(req: Request, res: Response): Promise<void> {
        try {
            const { studentIds, schoolId } = req.body;
            const checkedBy = (req as AuthRequest).user?.userId;

            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: '请选择要签到的学生'
                });
                return;
            }

            if (!schoolId) {
                res.status(400).json({
                    success: false,
                    message: '学校ID不能为空'
                });
                return;
            }

            const result = await checkinService.batchCheckin({
                studentIds,
                schoolId,
                checkedBy: checkedBy || ''
            });

            res.status(200).json({
                success: true,
                message: `成功签到 ${result.success.length} 人，失败 ${result.failed.length} 人`,
                data: result
            });
        } catch (error) {
            console.error('Batch checkin error:', error);
            res.status(500).json({
                success: false,
                message: '批量签到失败'
            });
        }
    }

    /**
     * 获取学生本月签到天数
     */
    private async getMonthlyCheckinCount(req: Request, res: Response): Promise<void> {
        try {
            const { studentId } = req.params;

            const count = await checkinService.getMonthlyCheckinCount(studentId);

            res.status(200).json({
                success: true,
                data: { count }
            });
        } catch (error) {
            console.error('Get monthly checkin count error:', error);
            res.status(500).json({
                success: false,
                message: '获取签到天数失败'
            });
        }
    }

    /**
     * 检查学生今日是否已签到
     */
    private async isTodayCheckedIn(req: Request, res: Response): Promise<void> {
        try {
            const { studentId } = req.params;

            const isCheckedIn = await checkinService.isTodayCheckedIn(studentId);

            res.status(200).json({
                success: true,
                data: { isCheckedIn }
            });
        } catch (error) {
            console.error('Check today checkin error:', error);
            res.status(500).json({
                success: false,
                message: '检查签到状态失败'
            });
        }
    }

    public getRoutes(): Router {
        return this.router;
    }
}

export default CheckinRoutes;
