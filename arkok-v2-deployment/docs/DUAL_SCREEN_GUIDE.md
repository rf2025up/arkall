# ArkOK V2 双模大屏系统使用指南

## 🎯 系统概述

ArkOK V2 现已支持**双模大屏**系统，可无缝切换：
- **日常监控模式 (MONITOR)**: 复刻经典大屏UI，展示完整的数据监控界面
- **战斗模式 (BATTLE)**: 全新科幻战斗界面，专为高燃PK事件设计

## 🚀 快速开始

### 访问地址
- **主地址**: http://localhost:5173/screen
- **备选地址**: http://localhost:5173/bigscreen

### 初始状态
系统启动时默认进入**日常监控模式**，展示：
- 学生排行榜（含等级和经验）
- PK对战榜
- 挑战擂台
- 队伍信息滚动
- 荣誉徽章展示

## ⚔️ 模式切换机制

### 1. 自动切换（生产环境）

#### PK战斗事件
```typescript
// 服务器发送事件
socket.emit('PK_START', {
  id: 'pk-001',
  studentA: { /* 学生A数据 */ },
  studentB: { /* 学生B数据 */ },
  topic: '量子计算竞赛',
  schoolId: 'school-001',
  startTime: '2025-12-12T08:00:00Z'
})

// 系统自动切换到战斗模式
```

#### PK结束事件
```typescript
// 服务器发送事件
socket.emit('PK_END', {
  id: 'pk-001',
  winner_id: 'student-a-id',
  endTime: '2025-12-12T08:05:00Z',
  duration: 300000, // 5分钟
  finalScores: { studentA: 95, studentB: 82 }
})

// 显示胜利动画，5秒后返回日常模式
```

#### 挑战成功事件
```typescript
// 服务器发送事件
socket.emit('CHALLENGE_SUCCESS', {
  id: 'challenge-001',
  studentId: 'student-001',
  studentName: '张三',
  challengeTitle: '星际探索',
  expAwarded: 500,
  pointsAwarded: 100,
  successTime: '2025-12-12T08:10:00Z'
})

// 显示胜利画面，3秒后返回日常模式
```

### 2. 手动切换（开发环境）

#### 调试面板
在开发环境中，左上角显示调试控制面板：

- **📊 日常模式**: 切换到监控模式
- **⚔️ 测试PK**: 触发模拟PK战斗
- **🏆 测试胜利**: 触发胜利庆祝动画

#### 键盘快捷键
- **按键 1**: 立即切换到日常模式
- **按键 2**: 触发测试PK战斗
- **按键 3**: 触发测试胜利画面

## 🎬 动画效果

### 模式切换动画
```typescript
// 日常模式 -> 战斗模式
initial: { opacity: 0, scale: 0.8, rotateY: 15 }
animate: { opacity: 1, scale: 1, rotateY: 0 }
duration: 0.8s
ease: [0.4, 0.0, 0.2, 1]

// 战斗模式 -> 日常模式
initial: { opacity: 0, scale: 1.2, rotateY: -15 }
animate: { opacity: 1, scale: 1, rotateY: 0 }
exit: { opacity: 0, scale: 0.95 }
```

### 视觉效果
- **3D透视转换**: `perspective: 1200px`
- **缩放效果**: 战斗模式入场放大 + 旋转
- **淡入淡出**: 优雅的透明度过渡
- **背景模糊**: `backdrop-blur-lg` 玻璃拟态效果

## 🎮 战斗模式特性

### 核心UI组件
1. **星空背景**: 150个动态星星粒子
2. **战斗卡片**: 3D倾斜、呼吸灯效果
3. **VS标识**: 动态发光、脉冲动画
4. **能量条**: 实时分数和能量显示
5. **胜利特效**: 王冠动画、高亮显示

### 交互效果
- **卡片呼吸**: `scale: [1, 1.1, 1]` 循环动画
- **能量流动**: 百分比条填充动画
- **光效脉冲**: 霓虹灯呼吸效果
- **粒子系统**: Canvas实时渲染

## 🛠️ 技术实现

### 状态管理
```typescript
const [mode, setMode] = useState<'MONITOR' | 'BATTLE'>('MONITOR')
const [battleData, setBattleData] = useState<BattleData>()
const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
```

### Socket监听器
```typescript
// PK开始
socketService.on('PK_START', handlePKStart)

// PK结束
socketService.on('PK_END', handlePKEnd)

// 挑战成功
socketService.on('CHALLENGE_SUCCESS', handleChallengeSuccess)
```

### 超时管理
```typescript
// 战斗结束后的自动返回
battleTimeoutRef.current = setTimeout(() => {
  setMode('MONITOR')
  setBattleData(undefined)
  battleTimeoutRef.current = null
}, 5000) // 5秒后返回
```

## 🔧 故障排除

### 连接问题
1. **Socket连接失败**: 检查服务器运行状态
2. **数据加载失败**: 确认API接口正常
3. **路由404**: 确认使用 `/screen` 或 `/bigscreen`

### 动画卡顿
1. **性能优化**: 减少同时运行的动画数量
2. **浏览器兼容**: 使用现代浏览器（Chrome/Firefox/Safari）
3. **硬件加速**: 启用GPU加速

### 调试功能
开发环境下提供完整的调试面板：
- **连接状态**: 实时显示Socket连接状态
- **模式指示**: 当前模式高亮显示
- **手动触发**: 测试各种切换场景

## 📊 性能指标

### 动画性能
- **帧率**: 60 FPS 目标
- **内存使用**: < 200MB
- **CPU占用**: < 15%

### 响应时间
- **模式切换**: < 800ms
- **数据加载**: < 2s
- **Socket响应**: < 100ms

## 🎯 最佳实践

### 1. 事件处理
- 清理超时器防止内存泄漏
- 正确移除Socket事件监听器
- 处理网络异常和重连

### 2. 用户体验
- 平滑的过渡动画
- 清晰的模式指示
- 错误状态的友好提示

### 3. 开发调试
- 利用开发面板测试各种场景
- 监控控制台日志输出
- 使用键盘快捷键快速切换

---

## 🎉 总结

双模大屏系统现已完全集成，提供：
- ✅ **无缝模式切换**: 日常 ↔ 战斗
- ✅ **智能事件响应**: PK/挑战自动触发
- ✅ **流畅动画效果**: framer-motion驱动
- ✅ **完整调试支持**: 开发环境工具
- ✅ **生产就绪**: 错误处理和性能优化

立即访问 http://localhost:5173/screen 体验全新的双模大屏系统！🚀