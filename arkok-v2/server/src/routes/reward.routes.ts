import { Router } from 'express';
import { RewardService } from '../services/reward.service';

const router = Router();

/**
 * 积分经验配置管理路由
 * 路径：/api/reward/*
 */

// 获取学校的所有奖励配置
router.get('/configs/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const rewardService = new RewardService(req.app.get('prisma'));

    const configs = await rewardService.getRewardConfigs(schoolId);

    res.json({
      success: true,
      data: configs
    });
  } catch (error: any) {
    console.error('获取奖励配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取奖励配置失败'
    });
  }
});

// 初始化默认奖励配置
router.post('/initialize/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const rewardService = new RewardService(req.app.get('prisma'));

    const configs = await rewardService.initializeDefaultConfigs(schoolId);

    res.json({
      success: true,
      data: configs,
      message: '默认奖励配置初始化成功'
    });
  } catch (error: any) {
    console.error('初始化奖励配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '初始化奖励配置失败'
    });
  }
});

// 创建或更新单个奖励配置
router.post('/configs', async (req, res) => {
  try {
    const rewardService = new RewardService(req.app.get('prisma'));
    const config = await rewardService.upsertRewardConfig(req.body);

    res.json({
      success: true,
      data: config,
      message: '奖励配置保存成功'
    });
  } catch (error: any) {
    console.error('保存奖励配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '保存奖励配置失败'
    });
  }
});

// 更新单个奖励配置
router.patch('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rewardService = new RewardService(req.app.get('prisma'));

    const config = await rewardService.updateRewardConfig({
      id,
      ...req.body
    });

    res.json({
      success: true,
      data: config,
      message: '奖励配置更新成功'
    });
  } catch (error: any) {
    console.error('更新奖励配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '更新奖励配置失败'
    });
  }
});

// 批量更新奖励配置
router.patch('/configs/:schoolId/batch', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'updates 必须是数组'
      });
    }

    const rewardService = new RewardService(req.app.get('prisma'));
    const configs = await rewardService.batchUpdateRewardConfigs(schoolId, updates);

    res.json({
      success: true,
      data: configs,
      message: '批量更新成功'
    });
  } catch (error: any) {
    console.error('批量更新奖励配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '批量更新奖励配置失败'
    });
  }
});

// 删除奖励配置
router.delete('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.query;

    if (!schoolId || typeof schoolId !== 'string') {
      return res.status(400).json({
        success: false,
        error: '缺少 schoolId 参数'
      });
    }

    const rewardService = new RewardService(req.app.get('prisma'));
    await rewardService.deleteRewardConfig(id, schoolId);

    res.json({
      success: true,
      message: '奖励配置删除成功'
    });
  } catch (error: any) {
    console.error('删除奖励配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '删除奖励配置失败'
    });
  }
});

export default router;
