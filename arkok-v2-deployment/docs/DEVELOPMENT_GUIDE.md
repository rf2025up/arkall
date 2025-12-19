# 🛠️ ArkOK V2 开发指南

**版本:** 1.0
**更新时间:** 2025-12-12
**目标读者:** 开发团队成员

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL >= 13.0
- Redis >= 6.0 (可选，用于缓存和实时通讯)

### 本地开发设置

1. **克隆项目**
   ```bash
   cd /home/devbox/project/arkok-v2
   ```

2. **安装依赖**
   ```bash
   # 安装根目录依赖
   npm install

   # 安装后端依赖
   cd server && npm install

   # 安装前端依赖
   cd ../client && npm install
   ```

3. **环境配置**
   ```bash
   # 复制环境变量模板
   cp server/.env.example server/.env
   cp client/.env.example client/.env

   # 编辑环境变量
   vim server/.env
   ```

4. **数据库初始化**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```

5. **启动开发服务器**
   ```bash
   # 返回根目录
   cd ..
   # 使用一键启动脚本
   ./dev.sh
   ```

### 项目结构详解

```
arkok-v2/
├── server/                     # 后端服务
│   ├── src/
│   │   ├── controllers/        # 控制器层
│   │   │   ├── auth.controller.ts
│   │   │   ├── student.controller.ts
│   │   │   └── task.controller.ts
│   │   ├── services/           # 业务逻辑层
│   │   │   ├── auth.service.ts
│   │   │   ├── student.service.ts
│   │   │   └── notification.service.ts
│   │   ├── middleware/         # 中间件
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── routes/            # 路由定义
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── students.routes.ts
│   │   │   └── tasks.routes.ts
│   │   ├── utils/             # 工具函数
│   │   │   ├── logger.ts
│   │   │   ├── crypto.ts
│   │   │   └── validators.ts
│   │   ├── types/             # TypeScript 类型定义
│   │   │   ├── api.types.ts
│   │   │   ├── auth.types.ts
│   │   │   └── database.types.ts
│   │   └── app.ts             # 应用入口
│   ├── prisma/                # 数据库相关
│   │   ├── schema.prisma      # 数据库模式
│   │   ├── migrations/        # 迁移文件
│   │   └── seed.ts            # 种子数据
│   ├── tests/                 # 测试文件
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   └── package.json
├── client/                    # 前端应用
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # 可复用组件
│   │   │   ├── common/        # 通用组件
│   │   │   │   ├── Button/
│   │   │   │   ├── Modal/
│   │   │   │   └── Loading/
│   │   │   ├── forms/         # 表单组件
│   │   │   └── layout/        # 布局组件
│   │   ├── pages/             # 页面组件
│   │   │   ├── auth/
│   │   │   ├── students/
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   ├── hooks/             # 自定义 Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useStudents.ts
│   │   │   └── useSocket.ts
│   │   ├── services/          # API 服务
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   └── student.service.ts
│   │   ├── store/             # 状态管理
│   │   │   ├── index.ts
│   │   │   ├── authSlice.ts
│   │   │   └── studentSlice.ts
│   │   ├── utils/             # 工具函数
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── validators.ts
│   │   ├── types/             # TypeScript 类型
│   │   │   ├── api.types.ts
│   │   │   └── component.types.ts
│   │   ├── styles/            # 样式文件
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/                 # 测试文件
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── ai-worker/                 # AI 服务 (预留)
│   ├── src/
│   │   ├── app.py
│   │   ├── services/
│   │   └── models/
│   ├── requirements.txt
│   └── Dockerfile
├── docs/                      # 项目文档
│   ├── ARCHITECTURE_WHITEPAPER.md
│   ├── DEVELOPMENT_GUIDE.md
│   ├── API_DOCUMENTATION.md
│   └── DEPLOYMENT_GUIDE.md
├── scripts/                   # 脚本文件
│   ├── dev.sh
│   ├── build.sh
│   └── deploy.sh
├── .gitignore
├── README.md
└── package.json
```

---

## 开发规范

### 编码规范

#### 1. TypeScript 规范

```typescript
// ✅ 好的实践
interface Student {
  id: string;
  name: string;
  classRoom: string;
  score: number;
  totalExp: number;
}

const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    const student = await prisma.student.findUnique({
      where: { id }
    });
    return student;
  } catch (error) {
    logger.error('Failed to get student:', error);
    return null;
  }
};

// ❌ 避免的实践
function getStudent(id: any): any {
  return prisma.student.findUnique({ where: { id } });
}
```

#### 2. React 组件规范

```typescript
// ✅ 函数式组件 + TypeScript
interface StudentCardProps {
  student: Student;
  onUpdate: (student: Student) => void;
  className?: string;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onUpdate,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = useCallback((updatedStudent: Student) => {
    onUpdate(updatedStudent);
    setIsEditing(false);
  }, [onUpdate]);

  return (
    <div className={`student-card ${className}`}>
      {/* 组件内容 */}
    </div>
  );
};

export default memo(StudentCard);
```

#### 3. API 控制器规范

```typescript
// ✅ 控制器示例
export class StudentController {
  async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const { schoolId } = req.params;
      const { page = 1, limit = 20, search } = req.query;

      const result = await studentService.getStudents({
        schoolId,
        page: Number(page),
        limit: Number(limit),
        search: search as string
      });

      res.json({
        success: true,
        data: result.students,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Git 提交规范

使用 Conventional Commits 规范：

```bash
# 功能开发
git commit -m "feat: add student management API"

# 问题修复
git commit -m "fix: resolve student ranking calculation error"

# 文档更新
git commit -m "docs: update API documentation"

# 样式调整
git commit -m "style: improve mobile responsive design"

# 重构代码
git commit -m "refactor: optimize database query performance"

# 性能优化
git commit -m "perf: implement Redis caching for student data"

# 测试相关
git commit -m "test: add unit tests for student service"
```

### 分支管理策略

```bash
# 创建功能分支
git checkout -b feature/student-management

# 提交代码
git add .
git commit -m "feat: implement student CRUD operations"

# 推送到远程
git push origin feature/student-management

# 创建 Pull Request
# 代码审查通过后合并到 develop 分支
```

---

## 测试指南

### 测试文件组织

```
tests/
├── unit/                     # 单元测试
│   ├── services/
│   │   ├── student.service.test.ts
│   │   └── auth.service.test.ts
│   └── utils/
│       ├── validators.test.ts
│       └── helpers.test.ts
├── integration/              # 集成测试
│   ├── api/
│   │   ├── students.test.ts
│   │   └── auth.test.ts
│   └── database/
│       └── migrations.test.ts
└── e2e/                      # 端到端测试
    ├── auth-flow.test.ts
    └── student-management.test.ts
```

### 测试编写示例

```typescript
// 单元测试示例
describe('StudentService', () => {
  let studentService: StudentService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      student: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    } as any;

    studentService = new StudentService(mockPrisma);
  });

  describe('getStudents', () => {
    it('should return paginated students', async () => {
      const mockStudents = [
        { id: '1', name: 'John', classRoom: 'A' },
        { id: '2', name: 'Jane', classRoom: 'B' }
      ];

      mockPrisma.student.findMany.mockResolvedValue(mockStudents);

      const result = await studentService.getStudents({
        schoolId: 'school1',
        page: 1,
        limit: 10
      });

      expect(result.students).toEqual(mockStudents);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      });
    });
  });
});
```

### 测试命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- StudentService

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

---

## API 开发指南

### RESTful API 设计

```typescript
// 路由定义示例
import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticateToken, validateRequest } from '../middleware';
import { createStudentSchema, updateStudentSchema } from '../schemas';

const router = Router();
const studentController = new StudentController();

// GET /api/v1/{schoolId}/students
router.get(
  '/:schoolId/students',
  authenticateToken,
  validateRequest(getStudentsSchema),
  studentController.getStudents
);

// POST /api/v1/{schoolId}/students
router.post(
  '/:schoolId/students',
  authenticateToken,
  validateRequest(createStudentSchema),
  studentController.createStudent
);

// PUT /api/v1/{schoolId}/students/{id}
router.put(
  '/:schoolId/students/:id',
  authenticateToken,
  validateRequest(updateStudentSchema),
  studentController.updateStudent
);

export default router;
```

### 响应格式标准化

```typescript
// 成功响应格式
{
  "success": true,
  "data": {
    // 实际数据
  },
  "message": "操作成功",
  "timestamp": "2025-12-12T10:30:00Z"
}

// 分页响应格式
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
  }
}

// 错误响应格式
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

### 错误处理

```typescript
// 全局错误处理中间件
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('API Error:', error);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details
      }
    });
  }

  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未授权访问'
      }
    });
  }

  // 默认错误
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误'
    }
  });
};
```

---

## 前端开发指南

### 组件开发规范

```typescript
// 组件结构示例
// components/StudentCard/index.tsx
import React, { memo } from 'react';
import { Student } from '../../types';
import { Avatar, Badge } from '../common';
import styles from './StudentCard.module.css';

interface StudentCardProps {
  student: Student;
  onUpdate?: (student: Student) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const StudentCard: React.FC<StudentCardProps> = memo(({
  student,
  onUpdate,
  onDelete,
  className = ''
}) => {
  const handleUpdate = () => {
    onUpdate?.(student);
  };

  const handleDelete = () => {
    onDelete?.(student.id);
  };

  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.header}>
        <Avatar src={student.avatar} name={student.name} />
        <div className={styles.info}>
          <h3 className={styles.name}>{student.name}</h3>
          <p className={styles.class}>{student.classRoom}</p>
        </div>
        <Badge
          text={`Lv.${student.level}`}
          variant={student.level >= 10 ? 'gold' : 'silver'}
        />
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>积分</span>
          <span className={styles.value}>{student.score}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>经验</span>
          <span className={styles.value}>{student.totalExp}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={handleUpdate} className={styles.editBtn}>
          编辑
        </button>
        <button onClick={handleDelete} className={styles.deleteBtn}>
          删除
        </button>
      </div>
    </div>
  );
});

StudentCard.displayName = 'StudentCard';
```

### 状态管理

```typescript
// Redux Toolkit 示例
// store/studentSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Student } from '../types';
import { studentService } from '../services';

interface StudentState {
  students: Student[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: StudentState = {
  students: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }
};

// 异步 Action
export const fetchStudents = createAsyncThunk(
  'students/fetchStudents',
  async (params: { schoolId: string; page?: number; search?: string }) => {
    const response = await studentService.getStudents(params);
    return response;
  }
);

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateStudent: (state, action: PayloadAction<Student>) => {
      const index = state.students.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.students[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取学生列表失败';
      });
  }
});

export const { clearError, updateStudent } = studentSlice.actions;
export default studentSlice.reducer;
```

### 自定义 Hooks

```typescript
// hooks/useStudents.ts
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchStudents, updateStudent } from '../store/studentSlice';
import { Student } from '../types';

export const useStudents = (schoolId: string) => {
  const dispatch = useDispatch();
  const { students, loading, error, pagination } = useSelector(
    (state: RootState) => state.students
  );

  const [filters, setFilters] = useState({
    page: 1,
    search: ''
  });

  const loadStudents = useCallback(() => {
    dispatch(fetchStudents({
      schoolId,
      ...filters
    }));
  }, [dispatch, schoolId, filters]);

  const handleUpdateStudent = useCallback((student: Student) => {
    dispatch(updateStudent(student));
  }, [dispatch]);

  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  return {
    students,
    loading,
    error,
    pagination,
    filters,
    loadStudents,
    handleUpdateStudent,
    handleSearch,
    handlePageChange
  };
};
```

---

## 实时通讯开发

### Socket.io 集成

```typescript
// 服务器端
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class SocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const user = await this.verifyToken(token);
        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const { schoolId } = socket.data.user;

      // 加入校区房间
      socket.join(`school:${schoolId}`);

      console.log(`User ${socket.data.user.id} connected to school ${schoolId}`);

      // 处理学生更新事件
      socket.on('student:update', (data) => {
        socket.to(`school:${schoolId}`).emit('student:updated', data);
      });

      // 处理断开连接
      socket.on('disconnect', () => {
        console.log(`User ${socket.data.user.id} disconnected`);
      });
    });
  }

  // 广播消息到指定校区
  broadcastToSchool(schoolId: string, event: string, data: any) {
    this.io.to(`school:${schoolId}`).emit(event, data);
  }

  // 发送消息给特定用户
  sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}
```

```typescript
// 客户端 Hook
// hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user?.token) return;

    socketRef.current = io(process.env.REACT_APP_SOCKET_URL!, {
      auth: {
        token: user.token
      }
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('student:updated', (data) => {
      // 处理学生更新事件
      console.log('Student updated:', data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.token]);

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string, callback?: (data: any) => void) => {
    socketRef.current?.off(event, callback);
  };

  return {
    socket: socketRef.current,
    emit,
    on,
    off
  };
};
```

---

## 部署指南

### Docker 配置

```dockerfile
# Dockerfile (Server)
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# 安装依赖
RUN npm ci

# 复制源代码
COPY server/ ./server/
COPY client/ ./client/

# 构建前端
WORKDIR /app/client
RUN npm run build

# 构建后端
WORKDIR /app/server
RUN npm run build

# 生产镜像
FROM node:18-alpine AS production

WORKDIR /app

# 复制后端构建文件
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package.json ./
COPY --from=builder /app/server/prisma ./prisma

# 复制前端构建文件
COPY --from=builder /app/client/dist ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### Sealos 部署配置

```yaml
# sealos-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arkok-v2
  labels:
    app: arkok-v2
spec:
  replicas: 2
  selector:
    matchLabels:
      app: arkok-v2
  template:
    metadata:
      labels:
        app: arkok-v2
    spec:
      containers:
      - name: arkok-v2
        image: arkok-v2:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: arkok-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: arkok-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: arkok-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: arkok-v2-service
spec:
  selector:
    app: arkok-v2
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: arkok-v2-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - arkok.example.com
    secretName: arkok-tls
  rules:
  - host: arkok.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: arkok-v2-service
            port:
              number: 80
```

### CI/CD 流水线

```yaml
# .github/workflows/deploy.yml
name: Deploy to Sealos

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm ci
        cd server && npm ci
        cd ../client && npm ci

    - name: Run tests
      run: npm test

    - name: Run E2E tests
      run: npm run test:e2e

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ secrets.REGISTRY_URL }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ${{ secrets.REGISTRY_URL }}/arkok-v2:latest
          ${{ secrets.REGISTRY_URL }}/arkok-v2:${{ github.sha }}

    - name: Deploy to Sealos
      run: |
        # 配置 kubectl
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig

        # 更新部署
        kubectl set image deployment/arkok-v2 arkok-v2=${{ secrets.REGISTRY_URL }}/arkok-v2:${{ github.sha }}
        kubectl rollout status deployment/arkok-v2
```

---

## 性能优化

### 数据库优化

```sql
-- 创建索引
CREATE INDEX CONCURRENTLY idx_students_school_class
ON students(school_id, class_room);

CREATE INDEX CONCURRENTLY idx_task_records_school_created
ON task_records(school_id, created_at DESC);

-- 分区表示例（按学校分区）
CREATE TABLE task_records_partitioned (
  LIKE task_records INCLUDING ALL
) PARTITION BY LIST (school_id);

-- 为每个学校创建分区
CREATE TABLE task_records_school_1
PARTITION OF task_records_partitioned
FOR VALUES IN ('school-1');
```

### 缓存策略

```typescript
// Redis 缓存服务
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// 缓存装饰器
export function Cache(ttl: number = 3600) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await method.apply(this, args);

      // 存储到缓存
      await this.cacheService.set(cacheKey, result, ttl);

      return result;
    };
  };
}

// 使用示例
export class StudentService {
  constructor(
    private prisma: PrismaClient,
    private cacheService: CacheService
  ) {}

  @Cache(1800) // 30分钟缓存
  async getStudentsBySchool(schoolId: string) {
    return this.prisma.student.findMany({
      where: { schoolId }
    });
  }
}
```

### 前端性能优化

```typescript
// 代码分割
const StudentManagement = lazy(() => import('./pages/StudentManagement'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// 虚拟滚动
import { FixedSizeList as List } from 'react-window';

const StudentList: React.FC<{ students: Student[] }> = ({ students }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <StudentCard student={students[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={students.length}
      itemSize={120}
    >
      {Row}
    </List>
  );
};

// 图片懒加载
const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="lazy-image-container">
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
    </div>
  );
};
```

---

## 常见问题排查

### 开发环境问题

#### 1. 数据库连接失败
```bash
# 检查数据库服务状态
sudo systemctl status postgresql

# 检查连接
psql -h localhost -U postgres -d arkok_db

# 重置数据库密码
sudo -u postgres psql
ALTER USER postgres PASSWORD 'your_password';
```

#### 2. 端口冲突
```bash
# 查看端口占用
lsof -i :3000
netstat -tulpn | grep :3000

# 杀死进程
kill -9 <PID>
```

#### 3. 依赖安装失败
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 生产环境问题

#### 1. 内存泄漏排查
```typescript
// 添加内存监控
const memwatch = require('@lhci/cli/src/collect/memwatch');

memwatch.on('leak', (info) => {
  logger.error('Memory leak detected:', info);
});

// 定期记录内存使用情况
setInterval(() => {
  const memUsage = process.memoryUsage();
  logger.info('Memory usage:', {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
  });
}, 60000); // 每分钟记录一次
```

#### 2. 数据库慢查询
```sql
-- 启用慢查询日志
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1秒
SELECT pg_reload_conf();

-- 查看慢查询
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### 3. API 响应慢
```typescript
// 添加性能监控中间件
import { performance } from 'perf_hooks';

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();

  res.on('finish', () => {
    const duration = performance.now() - start;

    if (duration > 1000) { // 超过1秒的请求
      logger.warn('Slow API request:', {
        method: req.method,
        url: req.url,
        duration: `${Math.round(duration)}ms`,
        statusCode: res.statusCode
      });
    }
  });

  next();
};
```

---

## 贡献指南

### 提交代码流程

1. **Fork 项目**到自己的 GitHub 账户
2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **编写代码**并确保通过所有测试
4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
5. **推送到远程仓库**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **创建 Pull Request**

### 代码审查清单

- [ ] 代码符合项目编码规范
- [ ] 包含必要的测试用例
- [ ] 文档已更新（如需要）
- [ ] 没有引入安全漏洞
- [ ] 性能影响可接受
- [ ] 兼容现有功能

### 发布流程

1. **更新版本号**
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. **生成变更日志**
   ```bash
   npm run changelog
   ```

3. **创建 Git Tag**
   ```bash
   git tag -a v1.1.0 -m "Release version 1.1.0"
   git push origin v1.1.0
   ```

4. **部署到生产环境**

---

*本开发指南将持续更新，欢迎团队成员贡献和完善。如有任何问题或建议，请随时提出。*