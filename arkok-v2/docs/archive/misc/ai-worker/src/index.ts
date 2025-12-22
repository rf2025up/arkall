import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OCRService } from './services/ocr';
import { ImageAnalysisService } from './services/imageAnalysis';
import { QueueService } from './services/queue';
import { ocrController } from './controllers/ocr';
import { analysisController } from './controllers/analysis';
import { errorHandler } from './middleware/errorHandler';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3012;

// 初始化服务
const ocrService = new OCRService();
const imageAnalysisService = new ImageAnalysisService();
const queueService = new QueueService();

// 中间件
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'arkok-ai-worker',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// API路由
app.use('/api/ocr', ocrController(ocrService, queueService));
app.use('/api/analysis', analysisController(imageAnalysisService, queueService));

// 队列状态监控
app.get('/api/queue/status', async (req, res) => {
  try {
    const status = await queueService.getQueueStatus();
    res.json(status);
  } catch (error) {
    console.error('获取队列状态失败:', error);
    res.status(500).json({ error: '内部服务器错误' });
  }
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    console.log('🤖 启动 ArkOK AI Worker 服务...');

    // 初始化队列连接
    await queueService.initialize();
    console.log('✅ 队列服务已连接');

    app.listen(PORT, () => {
      console.log(`🚀 AI Worker 服务运行在端口 ${PORT}`);
      console.log(`📋 服务端点:`);
      console.log(`   🏥 健康检查: http://localhost:${PORT}/health`);
      console.log(`   🔍 OCR识别: http://localhost:${PORT}/api/ocr`);
      console.log(`   🧠 图像分析: http://localhost:${PORT}/api/analysis`);
      console.log(`   📊 队列状态: http://localhost:${PORT}/api/queue/status`);
    });
  } catch (error) {
    console.error('❌ AI Worker 服务启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭 AI Worker 服务...');

  try {
    await queueService.close();
    console.log('✅ 队列连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭服务时发生错误:', error);
    process.exit(1);
  }
});

// 启动服务
startServer();