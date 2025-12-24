import { Router } from 'express';
import { PlatformService } from '../services/platform.service';
import { AuthService } from '../services/auth.service';
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.middleware';

export class PlatformRoutes {
    constructor(
        private platformService: PlatformService,
        private authService: AuthService
    ) { }

    getRoutes(): Router {
        const router = Router();

        // 所有平台路由都需要 Token 认证和平台管理员权限
        router.use(authenticateToken(this.authService));
        router.use(requirePlatformAdmin);

        /**
         * GET /api/platform/overview
         * 获取全平台概览统计
         */
        router.get('/overview', async (req, res) => {
            try {
                const stats = await this.platformService.getGlobalOverview();
                res.json({
                    success: true,
                    data: stats
                });
            } catch (error) {
                console.error('❌ Error in GET /api/platform/overview:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get platform overview',
                    error: (error as Error).message
                });
            }
        });

        /**
         * GET /api/platform/campuses
         * 获取所有校区列表
         */
        router.get('/campuses', async (req, res) => {
            try {
                const campuses = await this.platformService.listAllCampuses();
                res.json({
                    success: true,
                    data: campuses
                });
            } catch (error) {
                console.error('❌ Error in GET /api/platform/campuses:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to list campuses',
                    error: (error as Error).message
                });
            }
        });

        /**
         * PATCH /api/platform/campuses/:schoolId/status
         * 切换校区激活状态
         */
        router.patch('/campuses/:schoolId/status', async (req, res) => {
            try {
                const { schoolId } = req.params;
                const { isActive } = req.body;

                if (typeof isActive !== 'boolean') {
                    return res.status(400).json({
                        success: false,
                        message: 'isActive (boolean) is required'
                    });
                }

                const updated = await this.platformService.toggleCampusStatus(schoolId, isActive);
                res.json({
                    success: true,
                    data: updated
                });
            } catch (error) {
                console.error('❌ Error in PATCH /api/platform/campuses/status:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to update campus status',
                    error: (error as Error).message
                });
            }
        });

        /**
         * PATCH /api/platform/campuses/:schoolId/expiry
         * 更新校区服务到期时间
         */
        router.patch('/campuses/:schoolId/expiry', async (req, res) => {
            try {
                const { schoolId } = req.params;
                const { expiredAt } = req.body;

                if (!expiredAt) {
                    return res.status(400).json({
                        success: false,
                        message: 'expiredAt date is required'
                    });
                }

                const date = new Date(expiredAt);
                if (isNaN(date.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid date format'
                    });
                }

                const updated = await this.platformService.updateCampusExpiry(schoolId, date);
                res.json({
                    success: true,
                    data: updated
                });
            } catch (error) {
                console.error('❌ Error in PATCH /api/platform/campuses/expiry:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to update campus expiry',
                    error: (error as Error).message
                });
            }
        });

        return router;
    }
}

export default PlatformRoutes;
