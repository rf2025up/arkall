import { Router } from 'express';

const router = Router();

// 临时处理mistakes端点 - 返回空数据
router.get('/', async (req, res) => {
  try {
    // 返回空的错题数据
    res.json({
      success: true,
      data: [],
      message: '错题数据获取成功'
    });
  } catch (error) {
    console.error('获取错题数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取错题数据失败'
    });
  }
});

export default router;