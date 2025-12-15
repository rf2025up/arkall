# 📡 ArkOK V2 API 文档

**版本:** 1.0.0
**更新时间:** 2025-12-12
**Base URL:** `https://esboimzbkure.sealosbja.site/api/v1`

---

## 概述

ArkOK V2 API 采用 RESTful 设计风格，支持多租户架构，所有请求都需要包含 `schoolId` 参数以确保数据隔离。

### 认证方式

所有 API 请求需要在 Header 中包含 JWT Token：

```
Authorization: Bearer <your-jwt-token>
```

### 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据内容
  },
  "message": "操作成功",
  "timestamp": "2025-12-12T10:30:00Z"
}
```

#### 分页响应
```json
{
  "success": true,
  "data": [
    // 数据列表
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "message": "获取成功",
  "timestamp": "2025-12-12T10:30:00Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入数据验证失败",
    "details": [
      {
        "field": "name",
        "message": "姓名不能为空"
      }
    ]
  },
  "timestamp": "2025-12-12T10:30:00Z"
}
```

---

## 认证 API

### 用户登录

**POST** `/auth/login`

登录系统获取 JWT Token。

#### 请求参数
```json
{
  "username": "string",
  "password": "string",
  "schoolId": "string"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN",
      "schoolId": "school_456"
    },
    "expiresIn": 3600
  }
}
```

### 刷新 Token

**POST** `/auth/refresh`

使用当前 Token 获取新的 Token。

#### 请求头
```
Authorization: Bearer <current-token>
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

## 学生管理 API

### 获取学生列表

**GET** `/{schoolId}/students`

获取指定校区的学生列表，支持分页和搜索。

#### 查询参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `limit` | number | 否 | 每页数量，默认 20 |
| `search` | string | 否 | 搜索关键词（姓名或班级） |
| `classRoom` | string | 否 | 按班级筛选 |

#### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "id": "student_001",
      "name": "张三",
      "classRoom": "三年级一班",
      "avatar": "https://example.com/avatar.jpg",
      "score": 1250,
      "totalExp": 3400,
      "level": 12,
      "createdAt": "2025-12-01T10:00:00Z",
      "updatedAt": "2025-12-12T09:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 创建学生

**POST** `/{schoolId}/students`

在指定校区创建新学生。

#### 请求参数
```json
{
  "name": "string",
  "classRoom": "string",
  "avatar": "string"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "student_002",
    "name": "李四",
    "classRoom": "三年级二班",
    "avatar": null,
    "score": 0,
    "totalExp": 0,
    "level": 1,
    "createdAt": "2025-12-12T10:30:00Z",
    "updatedAt": "2025-12-12T10:30:00Z"
  }
}
```

### 更新学生信息

**PUT** `/{schoolId}/students/{studentId}`

更新指定学生的信息。

#### 请求参数
```json
{
  "name": "string",
  "classRoom": "string",
  "avatar": "string",
  "score": "number",
  "totalExp": "number"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "student_001",
    "name": "张三",
    "classRoom": "三年级一班",
    "avatar": "https://example.com/new-avatar.jpg",
    "score": 1300,
    "totalExp": 3500,
    "level": 12,
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-12T10:35:00Z"
  }
}
```

### 删除学生

**DELETE** `/{schoolId}/students/{studentId}`

删除指定学生。

#### 响应示例
```json
{
  "success": true,
  "message": "学生删除成功"
}
```

---

## 任务记录 API

### 获取任务记录列表

**GET** `/{schoolId}/task-records`

获取指定校区的任务记录列表。

#### 查询参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `limit` | number | 否 | 每页数量，默认 20 |
| `studentId` | string | 否 | 按学生ID筛选 |
| `taskType` | string | 否 | 任务类型 (HOMEWORK, EXAM, PARTICIPATION, BONUS) |
| `startDate` | string | 否 | 开始日期 (YYYY-MM-DD) |
| `endDate` | string | 否 | 结束日期 (YYYY-MM-DD) |

#### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "id": "task_001",
      "studentId": "student_001",
      "taskType": "HOMEWORK",
      "description": "数学作业完成",
      "score": 50,
      "exp": 100,
      "metadata": {
        "subject": "数学",
        "difficulty": "中等"
      },
      "createdAt": "2025-12-12T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

### 创建任务记录

**POST** `/{schoolId}/task-records`

为指定学生创建任务记录。

#### 请求参数
```json
{
  "studentId": "string",
  "taskType": "HOMEWORK|EXAM|PARTICIPATION|BONUS",
  "description": "string",
  "score": "number",
  "exp": "number",
  "metadata": {
    "subject": "string",
    "difficulty": "string"
  }
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "task_002",
    "studentId": "student_002",
    "taskType": "EXAM",
    "description": "期末考试",
    "score": 100,
    "exp": 200,
    "metadata": {
      "subject": "语文",
      "difficulty": "困难"
    },
    "createdAt": "2025-12-12T10:40:00Z"
  }
}
```

---

## 统计数据 API

### 获取概览统计

**GET** `/{schoolId}/stats/overview`

获取指定校区的概览统计数据。

#### 响应示例
```json
{
  "success": true,
  "data": {
    "totalStudents": 156,
    "totalTasks": 2340,
    "averageScore": 890,
    "averageLevel": 8,
    "topStudents": [
      {
        "id": "student_001",
        "name": "张三",
        "score": 2350,
        "level": 18
      }
    ],
    "recentTasks": [
      {
        "id": "task_001",
        "taskType": "HOMEWORK",
        "count": 45
      }
    ]
  }
}
```

### 获取排行榜

**GET** `/{schoolId}/stats/leaderboard`

获取指定校区的学生排行榜。

#### 查询参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 否 | 排行类型 (score, level, exp)，默认 score |
| `limit` | number | 否 | 返回数量，默认 10 |
| `classRoom` | string | 否 | 按班级筛选 |

#### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "id": "student_001",
      "name": "张三",
      "classRoom": "三年级一班",
      "score": 2350,
      "level": 18,
      "totalExp": 8900
    },
    {
      "rank": 2,
      "id": "student_002",
      "name": "李四",
      "classRoom": "三年级二班",
      "score": 2180,
      "level": 17,
      "totalExp": 8200
    }
  ]
}
```

---

## WebSocket 实时通讯

### 连接 WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('https://esboimzbkure.sealosbja.site', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 加入校区房间

```javascript
// 连接成功后自动加入对应校区房间
socket.on('connect', () => {
  console.log('Connected to server');
});
```

### 监听事件

#### 学生数据更新
```javascript
socket.on('student:updated', (data) => {
  console.log('Student updated:', data);
  // data: { studentId, changes, timestamp }
});
```

#### 任务记录创建
```javascript
socket.on('task:created', (data) => {
  console.log('Task created:', data);
  // data: { taskRecord, student }
});
```

#### 排行榜更新
```javascript
socket.on('leaderboard:updated', (data) => {
  console.log('Leaderboard updated:', data);
  // data: { type, rankings, timestamp }
});
```

### 发送事件

#### 广播学生更新
```javascript
socket.emit('student:update', {
  studentId: 'student_001',
  changes: {
    score: 1300
  }
});
```

---

## 错误代码

| 错误代码 | HTTP状态码 | 说明 |
|----------|------------|------|
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

---

## 速率限制

| 端点类型 | 限制 |
|----------|------|
| 认证相关 | 10 次/分钟 |
| 数据查询 | 100 次/分钟 |
| 数据修改 | 50 次/分钟 |
| 实时通讯 | 1000 次/分钟 |

---

## SDK 和工具

### JavaScript/TypeScript SDK

```bash
npm install @arkok/api-client
```

```typescript
import { ArkOKAPI } from '@arkok/api-client';

const api = new ArkOKAPI({
  baseURL: 'https://esboimzbkure.sealosbja.site/api/v1',
  token: 'your-jwt-token'
});

// 获取学生列表
const students = await api.students.list('school_123');

// 创建学生
const student = await api.students.create('school_123', {
  name: '张三',
  classRoom: '三年级一班'
});
```

### Python SDK

```bash
pip install arkok-api-client
```

```python
from arkok_api import ArkOKAPI

api = ArkOKAPI(
    base_url='https://esboimzbkure.sealosbja.site/api/v1',
    token='your-jwt-token'
)

# 获取学生列表
students = api.students.list('school_123')

# 创建学生
student = api.students.create('school_123', {
    'name': '张三',
    'classRoom': '三年级一班'
})
```

---

## 版本更新

### v1.0.0 (2025-12-12)
- ✅ 基础认证功能
- ✅ 学生 CRUD 操作
- ✅ 任务记录管理
- ✅ 统计数据查询
- ✅ WebSocket 实时通讯
- 🚧 多租户支持
- 🚧 速率限制

### 计划中的功能
- 📋 文件上传 API
- 📋 批量操作 API
- 📋 高级搜索功能
- 📋 数据导出功能
- 📋 Webhook 支持

---

## 支持和反馈

- **API 文档**: https://arkok-docs.example.com/api
- **问题反馈**: https://github.com/your-org/arkok-v2/issues
- **技术支持**: api-support@arkok.com
- **开发者社区**: https://community.arkok.com

---

*最后更新: 2025-12-12*