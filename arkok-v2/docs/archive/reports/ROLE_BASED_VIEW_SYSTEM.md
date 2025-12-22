# 基于角色的视图系统说明

## 🎯 系统设计目标

实现多层级权限管理，不同角色看到不同的学生数据：

### 📊 视图权限矩阵

| 角色 | 老师班级视图 | 全校大名单视图 | 说明 |
|------|-------------|---------------|------|
| **校长 (ADMIN)** | 不适用 | ✅ **所有学生** (46个) | 管理视角，看到全校完整学生情况 |
| **老师 (TEACHER)** | ✅ **自己的学生** (teacherId = 自己) | ✅ **未归属学生** (teacherId = null) | 教学视角，只看到可管理的和可抢入的学生 |

## 🔧 技术实现

### 后端查询逻辑 (`server/src/services/student.service.ts`)

```typescript
// 校长查看全校学生 - 无额外条件，显示所有学生
if (scope === 'ALL_SCHOOL' && userRole === 'ADMIN') {
  console.log(`[TEACHER BINDING] Querying ALL_SCHOOL for ADMIN`);
  // whereCondition 保持空，查询所有学生
}

// 老师查看全校学生 - 只显示未归属的学生
else if (scope === 'ALL_SCHOOL' && userRole === 'TEACHER') {
  console.log(`[TEACHER BINDING] Querying ALL_SCHOOL for teacher (for transfer): ${teacherId}`);
  whereCondition.teacherId = null; // 只显示未归属的学生
}

// 老师查看自己的学生
else if (scope === 'MY_STUDENTS' && teacherId) {
  whereCondition.teacherId = teacherId; // 只显示归属自己的学生
}
```

### 数据库数据状态

**当前数据分布** (2025-12-16 05:12):
- **总学生数**: 46个
- **未归属学生 (teacherId: null)**: 46个 (100%)
- **已归属学生**: 0个 (0%)

### 前端角色判断 (`client/src/pages/Home.tsx`)

```typescript
// 根据用户角色显示不同的提示文字
{user?.role === 'TEACHER' ? '查看全校学生并移入您的班级' : '查看所有班级的学生'}

// 只有老师角色才显示抢人功能
onTransfer={user?.role === 'TEACHER' ? handleTransferStudents : undefined}
```

## 🧪 测试场景

### 场景1: 校长登录测试
1. **登录账号**: admin / admin123
2. **预期行为**:
   - 左上角显示"系统管理员"或类似的校长标识
   - 全校大名单显示46个学生（全部）
   - 没有"抢人"功能按钮
   - 可以查看所有学生的归属情况

### 场景2: 老师登录测试
1. **登录账号**: long (龙老师) 或其他老师账号
2. **预期行为**:
   - 左上角显示"{老师姓名}的班级"
   - 老师班级显示0个学生（初始状态）
   - 全校大名单显示46个未归属学生
   - 长按学生显示"移入我的班级"按钮

### 场景3: 学生归属变更测试
1. **龙老师从全校移入3个学生**
2. **预期数据变化**:
   - 龙老师班级: 0 → 3个学生
   - 全校大名单(龙老师视角): 46 → 43个学生
   - 全校大名单(校长视角): 仍显示46个学生
   - 学生的teacherId从null变为龙老师ID

### 场景4: 老师间转移测试
1. **龙老师移入学生A**
2. **李老师从龙老师转移学生A**
3. **预期数据变化**:
   - 龙老师班级: 减少学生A
   - 李老师班级: 增加学生A
   - 校长视图: 学生A归属关系变更可见
   - 两个老师的"全校大名单"都看不到学生A（已被归属）

## 💡 系统优势

### 1. 权限分离
- **校长**: 宏观管理，看到完整学生生态
- **老师**: 微观管理，只关注自己的教学范围

### 2. 抢人机制
- 老师只能从未归属学生中抢人
- 不会出现重复抢入的情况
- 避免教学冲突

### 3. 数据一致性
- 所有学生都在校长视野中
- 老师操作不影响校长管理
- 归属关系清晰可追踪

## 🔍 API调用示例

### 老师获取全校学生
```http
GET /api/students?scope=ALL_SCHOOL&userRole=TEACHER&teacherId=xxx
# 返回: 只显示 teacherId = null 的学生
```

### 校长获取全校学生
```http
GET /api/students?scope=ALL_SCHOOL&userRole=ADMIN
# 返回: 显示所有学生，不管归属状态
```

### 老师获取自己的学生
```http
GET /api/students?scope=MY_STUDENTS&teacherId=xxx
# 返回: 只显示 teacherId = xxx 的学生
```

## ✅ 实现完成状态

- [x] 后端查询逻辑完成
- [x] 前端角色判断完成
- [x] 数据初始化完成
- [x] ADMIN测试账号准备完成
- [x] 文档编写完成
- [ ] 功能测试待执行

## 🚀 使用指南

1. **校长管理**: 使用admin账号登录，查看全校学生分布
2. **老师教学**: 使用老师账号登录，管理自己班级的学生
3. **抢人操作**: 老师在全校大名单中选择未归属学生移入班级
4. **学生转移**: 通过系统管理功能实现学生在不同老师间的转移

---

**实现完成时间**: 2025-12-16 05:12
**系统状态**: ✅ 开发完成，待用户测试验证