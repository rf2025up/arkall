# ArkOK V2 AI Worker Service

AI处理服务，提供OCR识别、图像分析等功能。

## 🚀 功能特性

- **OCR文字识别**: 支持中英文混合识别
- **图像预处理**: 自动优化图像质量提升识别准确率
- **批量处理**: 支持批量图像处理
- **队列系统**: 异步任务处理，支持高并发
- **错误恢复**: 自动重试和错误处理

## 🛠️ 技术栈

- **运行时**: Node.js + TypeScript
- **框架**: Express.js
- **OCR引擎**: Tesseract.js
- **图像处理**: Sharp
- **队列**: Bull (Redis)
- **数据库**: Prisma + PostgreSQL

## 📦 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件配置数据库和Redis连接
```

### 3. 开发模式运行

```bash
npm run dev
```

### 4. 生产模式运行

```bash
npm run build
npm start
```

## 📋 API端点

### 健康检查
- `GET /health` - 服务状态检查

### OCR识别
- `POST /api/ocr/recognize` - 单张图像OCR识别
- `POST /api/ocr/batch` - 批量图像OCR识别

### 图像分析
- `POST /api/analysis/mistake` - 错题分析
- `POST /api/analysis/handwriting` - 书写质量分析

### 队列管理
- `GET /api/queue/status` - 队列状态查询

## 🔧 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3012 |
| REDIS_HOST | Redis主机地址 | localhost |
| REDIS_PORT | Redis端口 | 6379 |
| DATABASE_URL | 数据库连接字符串 | - |
| MAX_FILE_SIZE | 最大文件大小 | 10MB |
| DEFAULT_LANGUAGES | 默认OCR语言 | chi_sim,eng |

### 支持的图像格式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- BMP (.bmp)
- TIFF (.tiff)

### 支持的OCR语言

- 简体中文 (chi_sim)
- 繁体中文 (chi_tra)
- 英语 (eng)
- 日语 (jpn)
- 韩语 (kor)

## 📊 性能指标

- **单张图像处理**: 通常 2-5 秒
- **批量处理**: 支持并发处理
- **识别准确率**: 优化后可达 95%+
- **支持分辨率**: 最高 2000x2000px

## 🔍 使用示例

### OCR识别示例

```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('languages', 'chi_sim,eng');
formData.append('enhance', 'true');

const response = await fetch('/api/ocr/recognize', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('识别结果:', result.text);
console.log('置信度:', result.confidence);
```

### 批量处理示例

```javascript
const formData = new FormData();
images.forEach((image, index) => {
  formData.append(`images`, image);
});
formData.append('languages', 'chi_sim,eng');

const response = await fetch('/api/ocr/batch', {
  method: 'POST',
  body: formData
});

const results = await response.json();
console.log('批量结果:', results);
```

## 🚨 错误处理

服务包含完整的错误处理机制：

- **输入验证**: 检查图像格式和大小
- **处理超时**: 防止长时间阻塞
- **自动重试**: 队列任务失败自动重试
- **错误日志**: 详细的错误信息记录

## 📈 监控和日志

- **访问日志**: 记录所有API请求
- **性能监控**: 处理时间和成功率
- **队列监控**: 任务队列状态和统计
- **错误统计**: 错误类型和频率

## 🔒 安全考虑

- **文件验证**: 严格的文件类型检查
- **大小限制**: 防止大文件攻击
- **CORS配置**: 跨域请求控制
- **速率限制**: API调用频率限制

## 🛠️ 开发指南

### 添加新的AI服务

1. 在 `src/services/` 目录下创建新服务
2. 在 `src/controllers/` 目录下创建对应控制器
3. 在 `src/index.ts` 中注册路由

### 自定义图像预处理

编辑 `src/services/ocr.ts` 中的 `preprocessImage` 方法：

```typescript
const processedBuffer = await sharp(imageBuffer)
  .resize(2000, 2000, { fit: 'inside' })
  .sharpen()
  .normalize()
  .toBuffer();
```

### 扩展队列功能

在 `src/services/queue.ts` 中添加新的队列处理器。

## 📝 更新日志

### v2.0.0 (2025-12-11)
- ✨ 初始版本发布
- ✨ OCR文字识别功能
- ✨ 图像预处理功能
- ✨ 队列异步处理
- ✨ 批量处理支持

---

🤖 **ArkOK V2 AI Worker** - 智能图像处理服务