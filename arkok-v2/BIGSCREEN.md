# ArkOK V2 大屏展示系统

## 🎯 概述

ArkOK V2 大屏展示系统是一个顶级的教育数据可视化平台，采用赛博朋克/星舰美学设计，提供实时数据展示和动态交互体验。

## ✨ 核心特性

### 🎨 视觉设计
- **暗黑主题**: 赛博朋克风格，深色背景配合霓虹色彩
- **渐变效果**: 青色到紫色的渐变配色方案
- **动态动画**: Framer Motion 驱动的流畅过渡效果
- **响应式布局**: 适配各种大屏显示设备

### ⚡ 实时功能
- **Socket.IO 集成**: 实时数据推送和更新
- **自动轮询**: 每5秒获取最新数据
- **事件驱动**: 分数更新、PK对战等实时事件响应
- **粒子特效**: 星空粒子效果庆祝积分获得

### 🏆 展示模块

#### 1. 排行榜模式 (默认)
- **Top 10 学生排行**: 动态排名，头像发光效果
- **实时活动流**: 显示最新的任务完成情况
- **班级统计**: 班级积分排名和平均分
- **PK对战状态**: 进行中的对战实时显示

#### 2. PK竞技场模式
- **倒计时动画**: 3-2-1-GO! 动态倒计时
- **战斗动画**: VS 对战动画，血条显示
- **技能特效**: 闪电、护盾等装饰效果
- **结果展示**: 胜负结果和统计数据

## 🚀 快速启动

### 开发环境
```bash
# 使用开发脚本一键启动
./dev.sh
```

### 手动启动
```bash
# 启动后端
cd server && npm run dev

# 启动前端
cd client && npm run dev
```

## 📱 访问地址

- **移动端管理**: http://localhost:5173
- **大屏展示**: http://localhost:5173/bigscreen
- **API 健康检查**: http://localhost:3011/health
- **Socket.IO 服务**: ws://localhost:3011

## 🔌 Socket.IO 事件

### 分数更新事件
```typescript
// 单个学生分数更新
socket.on('score_update', (data) => {
  // 触发星空粒子效果
  // 更新排行榜数据
});

// 批量分数更新
socket.on('batch_score_update', (data) => {
  // 触发大范围粒子效果
  // 更新多个学生数据
});
```

### PK对战事件
```typescript
// PK开始事件
socket.on('pk_start', (data) => {
  // 切换到竞技场模式
  // 显示对战动画
});
```

## 🎨 视觉组件

### 星空粒子效果 (StarParticleEffect)
- 触发条件：分数更新事件
- 持续时间：3-4秒
- 效果：100个粒子向四周扩散
- 颜色：白色粒子配合青色/紫色光晕

### 排行榜组件 (Leaderboard)
- 前3名特殊徽章：👑🥈🥉
- 头像发光效果：青色/紫色渐变
- 进度条动画：实时显示积分比例
- 悬停效果：卡片放大和发光

### PK竞技场 (PKArena)
- 三个阶段：倒计时 → 战斗 → 结果
- 动态血条：实时变化的生命值
- 旋转头像：对战双方的动态效果
- 粒子背景：战斗氛围营造

## 🛠️ 技术栈

### 前端
- **React 18**: 组件化开发
- **TypeScript**: 类型安全
- **Framer Motion**: 动画库
- **Tailwind CSS**: 样式框架
- **Socket.IO Client**: 实时通信

### 后端
- **Express.js**: Web框架
- **Socket.IO**: WebSocket服务
- **Prisma**: ORM数据库操作
- **PostgreSQL**: 数据存储

## 📊 数据格式

### 仪表板数据结构
```typescript
interface DashboardData {
  schoolStats: {
    totalStudents: number;
    totalPoints: number;
    totalExp: number;
    avgPoints: number;
    avgExp: number;
  };
  topStudents: Student[];
  activePKs: PKMatch[];
  recentChallenges: Challenge[];
  classRanking: ClassRanking[];
}
```

### 分数更新事件
```typescript
interface ScoreUpdateData {
  studentId: string;
  studentName: string;
  className: string;
  pointsAdded: number;
  expAdded: number;
  newPoints: number;
  newExp: number;
  reason: string;
  timestamp: string;
}
```

## 🎮 使用指南

### 大屏模式切换
1. 访问 http://localhost:5173/bigscreen
2. 系统自动连接到Socket.IO服务
3. 实时监听分数更新和PK事件
4. PK事件触发时自动切换到竞技场模式

### 测试功能
- 大屏页面包含"测试PK对战"按钮
- 可手动触发PK竞技场模式
- 用于演示和调试动画效果

### 移动端管理
- 访问 http://localhost:5173
- 使用移动端界面管理学生和分数
- 操作会实时反映到大屏展示

## 🎯 最佳实践

### 性能优化
- 使用 React.memo 优化组件渲染
- 动画使用 GPU 加速
- Socket 连接复用和错误处理
- 轮询数据智能缓存

### 浏览器兼容性
- 支持现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)
- 硬件加速推荐
- 全屏模式最佳体验

### 部署建议
- 使用 HTTPS 确保 Socket.IO 安全连接
- 配置适当的 CORS 策略
- 启用 gzip 压缩提升加载速度
- 考虑 CDN 加速静态资源

## 🔧 故障排除

### 常见问题

**Socket.IO 连接失败**
- 检查后端服务是否启动 (端口 3011)
- 确认代理配置是否正确
- 查看浏览器控制台错误信息

**动画卡顿**
- 检查浏览器硬件加速
- 关闭不必要的浏览器标签
- 确认设备性能满足要求

**数据不更新**
- 检查 Socket.IO 事件监听
- 确认后端数据推送正常
- 查看网络连接状态

## 📞 技术支持

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 技术文档：参考代码注释
- 开发者：查看项目贡献者信息