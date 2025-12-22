import { Router } from 'express';
import AuthService from '../services/auth.service';
import { authenticateToken } from '../middleware/auth.middleware';

/**
 * 错题管理路由 (V5.0)
 */
export class MistakesRoutes {
  private router: Router;

  constructor(private authService: AuthService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // 应用认证中间件
    this.router.use(authenticateToken(this.authService));

    // 获取错题 (目前返回空)
    this.router.get('/', async (req, res) => {
      res.json({
        success: true,
        data: [],
        message: '错题数据获取成功'
      });
    });
  }

  public getRoutes(): Router {
    return this.router;
  }
}