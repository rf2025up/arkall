# StarJourney + Growark 深度融合项目计划方案

## 项目概述

基于对Growark现有架构的深入分析和StarJourney错题/过关管理系统的功能特性，制定**渐进式插件化集成方案**，确保在不破坏现有功能的前提下，平稳融合两大系统的核心功能。

## 项目执行核心原则：测试驱动推进

### ⚠️ **严格测试确认机制**
**核心要求**：每一步都必须测试通过后才能进行下一步，确保项目稳定性和可靠性。

#### 测试验证流程：
1. **阶段启动前**：检查前置条件，确保环境就绪
2. **开发过程中**：每个功能模块完成后立即测试
3. **阶段完成前**：执行完整的阶段测试检查表
4. **阶段验收**：所有测试项100%通过才能进入下一阶段
5. **问题处理**：发现任何问题立即暂停，解决后重新测试

#### 测试失败处理：
- 立即停止当前阶段工作
- 识别问题根因并制定解决方案
- 修复问题后重新执行完整测试
- 确认无任何遗留问题才继续推进
- 记录问题和解决方案到文档

#### 测试确认责任人：
- **开发人员**：负责功能实现和单元测试
- **项目负责**：负责阶段验收和集成测试
- **用户确认**：负责功能验收和最终确认

#### 测试通过标准：
- **功能测试**：所有功能按预期工作
- **回归测试**：现有功能不受任何影响
- **性能测试**：满足性能指标要求
- **数据一致性**：数据库操作正确无误
- **用户体验**：界面响应流畅，错误处理完善

#### 测试文档要求：
- 每个测试项都有明确的结果记录
- 测试失败必须记录详细原因和解决方案
- 所有测试结果必须更新到进度文档
- 用户确认后才能标记为最终通过

## 一、数据库架构适配分析

### 1.1 Growark现有数据库结构（核心表）

```sql
-- 学生表 (已存在)
students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  score INTEGER DEFAULT 0,              -- 积分
  total_exp INTEGER DEFAULT 0,          -- 总经验值 (对应star系统的EXP)
  level INTEGER DEFAULT 1,              -- 等级
  avatar_url VARCHAR(500),
  team_id INTEGER REFERENCES teams(id),
  group_id INTEGER REFERENCES groups(id),
  class_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- 任务表 (已存在)
tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  exp_value INTEGER DEFAULT 0,          -- 经验值奖励
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- 任务分配表 (已存在)
task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, student_id)
)

-- 积分历史表 (已存在)
score_history (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  points_delta INTEGER,                 -- 积分变化
  exp_delta INTEGER,                    -- 经验值变化
  reason VARCHAR(200),                  -- 变化原因
  category VARCHAR(50),                 -- 类别
  created_by VARCHAR(100),              -- 操作人
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 1.2 需要扩展的数据库结构

```sql
-- 为融合StarJourney功能需要新增的表

-- 错题记录表 (新增)
CREATE TABLE lms_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    image_url VARCHAR(500),              -- 错题图片URL
    ocr_text TEXT,                       -- OCR识别的文本
    ai_analysis JSONB,                   -- AI分析结果 (包含setter_logic)
    subject VARCHAR(50),                 -- 学科 (math, chinese, english)
    status VARCHAR(20) DEFAULT 'pending', -- pending, solved, reviewed
    tags TEXT[],                         -- 知识点标签
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 过关记录表 (新增 - 扩展task_assignments概念)
CREATE TABLE lms_student_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    task_name VARCHAR(200) NOT NULL,     -- 任务名称 (如"口算达标")
    task_type VARCHAR(20) NOT NULL,      -- QC (质检) / TASK (过程任务)
    status VARCHAR(20) DEFAULT 'pending', -- pending, passed
    exp_value INTEGER DEFAULT 10,        -- 经验值奖励
    attempt_count INTEGER DEFAULT 0,     -- 尝试次数 (核心！体现服务价值)
    difficulty_flag BOOLEAN DEFAULT FALSE, -- 是否为"硬骨头"任务
    is_special BOOLEAN DEFAULT FALSE,    -- 是否为个性化加餐
    lesson_unit INTEGER,                 -- 当前单元
    lesson_lesson INTEGER,               -- 当前课次
    lesson_title VARCHAR(200),           -- 课程标题
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 学情报告表 (新增)
CREATE TABLE lms_academic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    report_type VARCHAR(20),             -- weekly, monthly
    start_date DATE,
    end_date DATE,
    radar_data JSONB,                    -- 五维能力雷达图数据
    ai_comment TEXT,                     -- AI生成的评语
    total_mistakes INTEGER DEFAULT 0,    -- 错题总数
    weak_points JSONB,                   -- 薄弱知识点分析
    action_plan TEXT[],                  -- 改进建议
    pdf_url VARCHAR(500),                -- 生成的PDF报告链接
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 教师备课记录表 (新增)
CREATE TABLE lms_lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id VARCHAR(100),             -- 教师标识
    subject VARCHAR(50),                 -- 学科
    unit INTEGER,                        -- 单元
    lesson INTEGER,                      -- 课次
    title VARCHAR(200),                  -- 课程标题
    qc_items TEXT[],                     -- 质检过关项列表
    task_items TEXT[],                   -- 过程任务列表
    special_tasks JSONB,                 -- 个性化加餐任务
    is_published BOOLEAN DEFAULT FALSE,  -- 是否已发布
    publish_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 二、分阶段实施计划

### 阶段1：数据库结构扩展 (第1周)

**目标**：扩展数据库结构，支持错题和过关管理功能

**实施步骤**：
1. 创建数据库扩展脚本 `star-extend-schema.js`
2. 执行脚本，新增4个表
3. 测试数据插入和查询
4. 备份数据库

**验收标准**：
- [ ] 新表创建成功，结构正确
- [ ] 外键约束正常工作
- [ ] 索引创建成功
- [ ] 数据完整性验证通过

### 阶段2：后端API接口适配 (第2周)

**目标**：在现有server.js基础上增加StarJourney功能的API接口

**需要新增的API接口**：
```javascript
// 错题管理API
POST   /api/mistakes/upload           // 上传错题图片
GET    /api/mistakes                 // 获取错题列表
PUT    /api/mistakes/:id             // 更新错题状态
DELETE /api/mistakes/:id             // 删除错题记录

// 过关管理API (适配growark经验值系统)
GET    /api/student-records          // 获取学生过关记录
POST   /api/student-records          // 创建过关记录
PATCH  /api/student-records/:id/attempt  // 记录辅导尝试 (核心功能)
PATCH  /api/student-records/:id/pass     // 标记为通过
DELETE /api/student-records/:id      // 删除过关记录

// 学情报告API
GET    /api/academic-reports         // 获取学情报告
POST   /api/academic-reports/generate // 生成新报告

// 备课管理API
GET    /api/lesson-plans             // 获取备课计划
POST   /api/lesson-plans             // 创建备课计划
PATCH  /api/lesson-plans/:id/publish // 发布备课计划
```

**适配策略**：
- 复用现有的数据库连接池
- 使用现有的错误处理机制
- 集成现有的WebSocket推送
- 适配现有的身份验证

### 阶段3：前端UI组件开发 (第3-4周)

**目标**：创建符合Growark设计规范的StarJourney功能组件

**3.1 设计规范适配**
- 使用Growark现有的颜色变量 (`--qc-color`, `--task-color`, `--primary`)
- 保持现有的卡片式布局和圆角设计
- 使用现有的图标字体和尺寸规范
- 保持现有的触觉反馈和动画效果

**3.2 核心组件开发**

1. **StudentProfileModal.tsx** (主要组件)
```typescript
// 学生详情Modal - 双Tab设计
interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: (message: string) => void; // 适配现有反馈机制
}
```

2. **GrowthTab.tsx** (原有功能封装)
```typescript
// 成长Tab - 封装现有的ActionSheet逻辑
interface GrowthTabProps {
  student: Student;
  onSuccess: (message: string) => void;
}
```

3. **AcademicTab.tsx** (新功能)
```typescript
// 学业Tab - 错题和过关管理
interface AcademicTabProps {
  student: Student;
  onSuccess: (message: string) => void;
}
```

**3.3 集成策略**
- 在现有的`Home.tsx`中添加学生点击处理
- 使用现有的状态管理模式 (useState, useEffect)
- 复用现有的API调用机制
- 保持现有的Toast反馈样式

### 阶段4：核心功能实现 (第5-6周)

**4.1 错题管理功能**
- 图片上传和OCR识别 (集成AI服务)
- 错题列表展示和状态管理
- 错题详情查看和编辑

**4.2 过关管理功能 (重点适配)**
- 质检台界面 (适配现有学生卡片设计)
- 辅导尝试记录 (核心功能：体现服务价值)
- 过关状态管理 (适配现有经验值系统)
- 结算台界面 (展示尝试次数标签)

**4.3 数据同步机制**
- 错题过关自动添加经验值到`students.total_exp`
- 过关记录同步到`score_history`表
- 实时推送数据更新 (复用现有WebSocket)

### 阶段5：集成测试和优化 (第7-8周)

**5.1 功能测试**
- [ ] 错题上传和识别准确率测试
- [ ] 过关流程完整性测试
- [ ] 数据一致性验证
- [ ] 并发操作测试

**5.2 性能优化**
- [ ] 图片上传优化 (压缩和懒加载)
- [ ] 列表虚拟滚动 (大数量优化)
- [ ] API响应时间优化
- [ ] 数据库查询优化

**5.3 用户体验优化**
- [ ] 加载状态指示
- [ ] 错误处理和用户反馈
- [ ] 触觉反馈优化
- [ ] 界面响应性优化

## 三、严格测试确认流程

### 3.1 每阶段测试检查表

#### 阶段1测试检查表 (数据库扩展)
```bash
# 1. 数据库结构验证
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d lms_mistakes"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d lms_student_record"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d lms_academic_reports"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d lms_lesson_plans"

# 2. 外键约束测试
INSERT INTO lms_student_record (student_id, task_name) VALUES (99999, 'test');
-- 预期：应该报错，因为student_id不存在

# 3. 数据完整性测试
INSERT INTO lms_student_record (student_id, task_name, status)
SELECT id, '测试任务', 'pending' FROM students LIMIT 1;
SELECT * FROM lms_student_record WHERE task_name = '测试任务';
-- 预期：应该能正确插入和查询
```

#### 阶段2测试检查表 (API接口)
```bash
# 1. API健康检查
curl -X GET http://localhost:3000/api/student-records
# 预期：返回空数组或记录列表

# 2. 错误处理测试
curl -X POST http://localhost:3000/api/mistakes/upload \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# 预期：返回400错误和详细错误信息

# 3. 数据库集成测试
curl -X POST http://localhost:3000/api/student-records \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "task_name": "测试", "task_type": "QC"}'
# 预期：创建成功，返回新记录ID
```

#### 阶段3测试检查表 (UI组件)
```typescript
// 1. 组件渲染测试
describe('StudentProfileModal', () => {
  test('应该正确渲染学生信息', () => {
    const student = { id: 1, name: '测试学生', total_exp: 100 };
    render(<StudentProfileModal student={student} onClose={() => {}} />);
    expect(screen.getByText('测试学生')).toBeInTheDocument();
  });

  test('Tab切换应该正常工作', () => {
    // 测试成长Tab和学业Tab切换
  });
});
```

#### 阶段4测试检查表 (核心功能)
```javascript
// 1. 过关流程测试
describe('Record Attempt Flow', () => {
  test('辅导尝试应该正确计数', async () => {
    // 创建初始记录
    const record = await createStudentRecord({ studentId: 1, taskName: '口算' });
    expect(record.attempt_count).toBe(0);

    // 记录一次辅导
    const updated = await recordAttempt(record.id);
    expect(updated.attempt_count).toBe(1);
    expect(updated.status).toBe('pending');
  });

  test('过关应该正确奖励经验值', async () => {
    const initialExp = await getStudentExp(1);
    await passStudentRecord(recordId);
    const finalExp = await getStudentExp(1);
    expect(finalExp).toBe(initialExp + 10); // 假设任务奖励10exp
  });
});
```

### 3.2 回归测试检查表

在每次修改后，必须运行以下回归测试：

```bash
# 1. 现有功能不受影响
curl -X GET http://localhost:3000/api/students          # 学生列表
curl -X GET http://localhost:3000/api/tasks            # 任务列表
curl -X GET http://localhost:3000/api/challenges       # 挑战列表
curl -X GET http://localhost:3000/api/badges           # 勋章列表

# 2. 前端页面正常加载
curl -I http://localhost:3000/app                      # 手机端
curl -I http://localhost:3000/screen                   # 大屏端

# 3. WebSocket连接正常
wscat -c ws://localhost:3000/ws                        # 测试实时通信
```

### 3.3 生产部署前检查表

- [ ] 数据库备份完成
- [ ] 环境变量配置正确
- [ ] SSL证书配置
- [ ] 日志级别设置为生产级别
- [ ] 性能监控配置
- [ ] 错误报告配置
- [ ] 用户手册更新

## 四、风险控制措施

### 4.1 技术风险
1. **数据迁移风险**：执行前完整备份数据库
2. **性能影响**：新增查询建立索引，监控响应时间
3. **兼容性问题**：保持现有API不变，新增API独立版本

### 4.2 进度风险
1. **功能复杂度**：每周检查进度，及时调整
2. **测试时间**：预留充足的测试和修复时间
3. **部署风险**：分阶段部署，先灰度测试

### 4.3 用户体验风险
1. **学习成本**：保持现有界面，新功能渐进式引入
2. **性能下降**：严格监控加载时间和响应速度
3. **数据错误**：完善的数据验证和回滚机制

## 五、项目时间表

| 阶段 | 时间 | 主要任务 | 交付物 |
|------|------|----------|--------|
| 准备阶段 | 第0周 | 环境搭建，需求确认 | 开发环境，确认文档 |
| 阶段1 | 第1周 | 数据库结构扩展 | 数据库脚本，测试报告 |
| 阶段2 | 第2周 | 后端API接口 | API文档，接口测试 |
| 阶段3 | 第3-4周 | 前端UI组件 | 组件库，UI测试 |
| 阶段4 | 第5-6周 | 核心功能实现 | 功能演示，集成测试 |
| 阶段5 | 第7-8周 | 测试优化 | 测试报告，性能报告 |
| 部署上线 | 第9周 | 生产部署 | 上线文档，监控配置 |

## 六、Devbox环境与Sealos配置

### 6.1 环境特点说明
**重要提醒**：本项目运行在Devbox环境中，每次重新启动后AI助手可能会丢失记忆，因此需要将所有关键配置和操作步骤文档化，确保能够快速恢复工作状态。

### 6.2 Devbox环境配置
```bash
# 工作目录
/home/devbox/project

# 项目结构
arkok/                    # 主项目目录
├── server.js            # 后端服务 (监听0.0.0.0:3000)
├── .env                 # 环境变量配置
├── mobile/              # 前端源码
└── public/              # 静态文件

# 启动命令
./entrypoint.sh          # 自动加载.env并启动server.js
```

### 6.3 Sealos云平台配置
```bash
# 数据库连接信息 (固定不变)
DB_HOST=growark-postgresql.ns-bg6fgs6y.svc  # 集群内网地址
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=kngwb5cb

# 服务配置
PORT=3000                # 应用端口
NODE_ENV=development     # 开发环境
```

### 6.4 公网访问配置
**注意**：每次新建Devbox实例时，公网地址会改变，需要重新获取。

#### 获取公网地址流程：
1. 启动服务：`./entrypoint.sh`
2. 等待2-5分钟网关准备
3. 从Sealos控制台获取最新公网地址
4. 更新所有文档中的公网地址

#### 访问路径：
- **手机端**：`http://公网地址/app`
- **大屏端**：`http://公网地址/screen`
- **管理端**：`http://公网地址/admin`
- **API接口**：`http://公网地址/api/*`

### 6.5 快速环境恢复检查表
每次重新启动Devbox后，执行以下检查：

```bash
# 1. 检查项目文件
cd /home/devbox/project
ls -la star-*.md    # 确认项目文档存在
ls -la arkok/server.js  # 确认后端文件存在

# 2. 检查数据库连接
psql -h growark-postgresql.ns-bg6fgs6y.svc -U postgres -d postgres -c "\dt"

# 3. 检查服务启动
./entrypoint.sh
ps aux | grep "arkok/server.js"  # 确认服务运行

# 4. 检查端口监听
netstat -tulpn | grep :3000

# 5. 检查API响应
curl http://localhost:3000/api/students
curl http://localhost:3000/health
```

### 6.6 批量更新公网地址命令
当公网地址变更时，使用以下命令批量更新：

```bash
# 获取新公网地址 (替换NEW_IP为实际地址)
NEW_IP="xtrhwhsclsvp.sealosbja.site"

# 批量更新文档中的地址
find . -name "*.md" -type f -exec sed -i "s|https://[^.]*\.sealosbja\.site|https://$NEW_IP|g" {} \;
find . -name "*.js" -type f -exec sed -i "s|https://[^.]*\.sealosbja\.site|https://$NEW_IP|g" {} \;
find . -name "*.ts" -type f -exec sed -i "s|https://[^.]*\.sealosbja\.site|https://$NEW_IP|g" {} \;
find . -name "*.tsx" -type f -exec sed -i "s|https://[^.]*\.sealosbja\.site|https://$NEW_IP|g" {} \;
```

### 6.7 环境记忆恢复
由于Devbox环境的临时性，每次重新启动后需要：

1. **重新阅读项目文档**：
   ```bash
   cat star-融合计划文档.md     # 了解项目计划
   cat star-融合进度跟踪文档.md # 了解当前进度
   ```

2. **确认项目状态**：
   ```bash
   # 查看最新修改的文件
   find . -name "*.js" -o -name "*.md" | xargs ls -lt | head -10

   # 查看git状态
   git status
   git log --oneline -5
   ```

3. **重新建立工作上下文**：
   - 检查数据库当前状态
   - 确认服务运行状态
   - 查看最近的开发日志

### 6.8 数据备份和恢复
```bash
# 数据库备份
pg_dump -h growark-postgresql.ns-bg6fgs6y.svc -U postgres -d postgres > backup-$(date +%Y%m%d).sql

# 数据库恢复
psql -h growark-postgresql.ns-bg6fgs6y.svc -U postgres -d postgres < backup-20251209.sql

# 项目文件备份
tar -czf project-backup-$(date +%Y%m%d).tar.gz star-*.md arkok/
```

## 七、成功标准

### 7.1 功能完整性
- [ ] 错题上传和识别功能正常
- [ ] 过关管理和尝试记录准确
- [ ] 学情报告生成正确
- [ ] 数据同步无错误

### 7.2 性能指标
- [ ] 页面加载时间 < 2秒
- [ ] API响应时间 < 500ms
- [ ] 图片上传时间 < 5秒
- [ ] 数据库查询优化 > 90%命中率

### 7.3 用户体验
- [ ] 界面操作流畅，无明显卡顿
- [ ] 错误提示清晰，用户反馈及时
- [ ] 功能学习成本低，现有用户可快速上手
- [ ] 移动端适配良好，触控操作精准

### 7.4 环境稳定性
- [ ] Devbox环境快速恢复机制完善
- [ ] Sealos配置文档完整准确
- [ ] 公网地址变更流程清晰
- [ ] 数据备份和恢复机制可靠

---

**注意事项**：
1. 每个阶段完成后必须进行全面测试确认
2. 发现问题立即暂停，解决后再继续
3. 保持与现有系统的兼容性，不破坏现有功能
4. 定期备份代码和数据，确保可以快速回滚
5. 遵循Growark现有的代码规范和开发流程