# 📚 ArkOK V2 文档管理与保存规则

**版本**: v1.0
**创建时间**: 2025-12-15
**维护负责人**: 技术负责人 & 文档管理员
**适用范围**: 所有项目参与人员

---

## 🎯 核心原则

### 1. 文档即真理 (Documentation is Truth) - 最高优先级
**原则**: 文档是项目状态的唯一真实反映，代码必须与文档保持一致

**执行要求**:
- 每次功能完成或修复，**必须立即**更新相关文档
- 文档状态与实际状态不一致时，以文档为准进行修正
- 禁止"代码先改，文档后补"的工作方式

**违规后果**:
- 第一次: 警告并强制更新文档
- 第二次: 暂停代码提交权限
- 严重违规: 从项目中移除

### 2. 实时同步原则 (Real-time Sync)
**原则**: 项目状态的任何变化都必须实时反映在文档中

**触发条件**:
- ✅ 功能开发完成
- ✅ Bug修复完成
- ✅ 架构设计变更
- ✅ 部署环境变更
- ✅ 项目计划调整
- ✅ 技术决策变更

---

## 📋 强制存档规则

### 1. 会话结束前强制存档

**触发条件**: 在执行以下任何命令**之前**必须存档：
```bash
# 🛑 高风险操作 - 必须先存档
npm run build          # 前端构建
./dev.sh               # 服务重启
docker-compose restart # 容器重启
git commit             # 代码提交
# 任何包含 "restart" 的命令
```

**强制执行流程**:
```bash
# 1. 立即停止当前操作
echo "🛡️ 检测到高风险操作，执行强制存档..."

# 2. 更新项目状态 (必须执行)
echo "$(date '+%Y-%m-%d %H:%M:%S') - 执行前存档: [具体操作描述]" >> docs/CURRENT_STATUS.md
echo "最近的修改: [简述刚才完成的工作]" >> docs/CURRENT_STATUS.md
echo "当前状态: [当前进度百分比或状态]" >> docs/CURRENT_STATUS.md

# 3. 更新任务进度 (必须执行)
# 在 TASK_PROGRESS.md 中找到当前任务，更新进度状态
# 格式: "$(date '+%Y-%m-%d %H:%M:%S') - [任务名称] [进度状态]"

# 4. 验证文档更新 (必须执行)
echo "✅ 文档存档完成，可以安全执行操作"
```

**存档内容检查清单**:
- [ ] 最近完成的功能修改已记录在 `CURRENT_STATUS.md`
- [ ] 当前任务的进度状态已更新在 `TASK_PROGRESS.md`
- [ ] 下次开发者能够根据文档快速理解当前状态
- [ ] 未完成的功能明确标记为 `[ ]` 状态

### 2. 原子化任务存档

**适用场景**: 执行多步骤复杂任务时（如批量修复多个页面）

**执行规则**:
```bash
# 每完成一个子任务，立即更新
task_id="TASK-2025-1201"
subtask_name="学生详情页UI修复"
status="completed"  # 或 "in_progress"

# 更新任务进度
echo "$(date '+%Y-%m-%d %H:%M:%S') - $task_id $subtask_name: $status" >> docs/TASK_PROGRESS.md
echo "当前进度: [已完成的子任务数]/[总子任务数]" >> docs/TASK_PROGRESS.md
```

### 3. 紧急情况快速存档

**触发条件**: 系统即将崩溃、会话意外中断

**最小化存档**:
```bash
echo "🚨 紧急存档 - $(date)" >> docs/SESSION_STATUS_LOG.md
echo "当前任务: [简述任务]" >> docs/SESSION_STATUS_LOG.md
echo "进度: [百分比或状态]" >> docs/SESSION_STATUS_LOG.md
echo "下次续接: [关键点或下一步]" >> docs/SESSION_STATUS_LOG.md
```

---

## 🔄 会话安全管理

### 1. 会话开始时的强制检查

**新会话启动时必须执行**:
```bash
# 1. 读取项目状态
cat docs/CURRENT_STATUS.md

# 2. 读取任务进度
cat docs/TASK_PROGRESS.md

# 3. 确认上次中断点
echo "🔍 上次会话中断点确认..."

# 4. 更新会话状态
echo "$(date '+%Y-%m-%d %H:%M:%S') - 新会话开始" >> docs/SESSION_STATUS_LOG.md
echo "当前状态: [根据文档分析得出]" >> docs/SESSION_STATUS_LOG.md
```

### 2. 会话结束时的强制同步

**会话结束前的必要操作**:
```bash
# 1. 生成状态总结报告
echo "=== 会话结束状态同步 ===" > docs/SESSION_SUMMARY.md
echo "结束时间: $(date)" >> docs/SESSION_SUMMARY.md
echo "当前已完成: [列出已完成项目]" >> docs/SESSION_SUMMARY.md
echo "未完成项目: [列出未完成项目]" >> docs/SESSION_SUMMARY.md
echo "下次续接点: [明确指出下次应从哪里开始]" >> docs/SESSION_SUMMARY.md

# 2. 更新主要状态文档
echo "$(date): 会话结束，状态已同步" >> docs/CURRENT_STATUS.md
echo "$(date): 当前任务进度已更新" >> docs/TASK_PROGRESS.md
```

---

## 📁 文档结构维护规则

### 1. 文档命名规范

**标准命名**:
```
核心架构文档:
- ARCHITECTURE_WHITEPAPER.md    # 技术白皮书 (最重要)
- API_DOCUMENTATION.md          # API接口文档

业务功能文档:
- FEATURE_SPEC.md               # 功能规格说明

开发规范文档:
- DEVELOPMENT_GUIDE.md          # 详细开发指南
- DEVELOPMENT_RULES.md          # 开发行为准则
- TYPE_SAFETY_COMPLETE.md       # 类型安全报告

项目管理文档:
- TASK_PROGRESS.md               # 任务进度追踪 (实时更新)
- PROJECT_PROGRESS.md           # 项目完成状态报告

用户界面文档:
- BATTLE_MODE_GUIDE.md          # 战斗模式指南
- DUAL_SCREEN_GUIDE.md          # 双屏互动指南

公共文档:
- PUBLIC_DEPLOYMENT.md          # 公网部署指南
- DOCUMENTATION_INDEX.md        # 文档索引 (新增)
- DOCUMENTATION_RULES.md        # 本规则文档 (新增)
```

### 2. 文档内容结构规范

**每个文档必须包含的头部信息**:
```markdown
# [文档标题]

**版本**: [版本号]
**创建时间**: [YYYY-MM-DD]
**最后更新**: [YYYY-MM-DD]
**维护负责人**: [责任人]
**适用范围**: [适用人群]
**状态**: [✅ 完成 / 🔄 进行中 / 📋 规划中]

---

## 概述
[文档用途和重要性说明]

---
```

### 3. 文档更新标记规范

**状态标记系统**:
```markdown
✅ 已完成 (Completed)
🔄 进行中 (In Progress)
📋 规划中 (Planned)
❌ 已取消 (Cancelled)
⚠️ 问题 (Issue)
🚨 紧急 (Urgent)
```

**时间戳格式**:
```markdown
# 统一使用 ISO 8601 格式
2025-12-15T14:30:00Z  # 国际标准时间
2025-12-15 22:30:00   # 本地时间 (24小时制)
```

---

## 🔍 质量检查规则

### 1. 每日质量检查

**检查频率**: 每日结束前
**检查项目**:
- [ ] 文档是否与代码状态一致？
- [ ] TASK_PROGRESS.md 是否更新到最新状态？
- [ ] CURRENT_STATUS.md 是否反映当前项目健康度？
- [ ] 所有未完成任务是否明确标记？
- [ ] 下次开发者能否快速理解项目状态？

### 2. 周度质量审查

**审查频率**: 每周五
**审查内容**:
- 文档完整性检查
- 信息准确性验证
- 交叉引用有效性
- 版本控制合规性

### 3. 月度质量优化

**优化频率**: 每月最后一周
**优化内容**:
- 文档结构优化
- 内容冗余清理
- 用户体验改进
- 工具效率提升

---

## ⚠️ 违规处理机制

### 1. 违规等级分类

**🔴 严重违规 (立即处理)**
- 高风险操作前未执行强制存档
- 故意提供虚假文档信息
- 删除或篡改重要文档记录
- **处理**: 立即暂停权限 + 技术委员会审查 + 书面检查

**🟡 高级违规 (24小时内修复)**
- 文档更新延迟超过2小时
- 文档信息与实际状态不符
- 未按规范格式更新文档
- **处理**: 强制重构 + 代码重新审查 + 文档培训

**🟢 中级违规 (本周内修复)**
- 文档格式不规范
- 交叉引用链接失效
- 版本号更新遗漏
- **处理**: 计划修复 + 团队培训 + 最佳实践分享

### 2. 违规记录管理

**记录方式**:
```markdown
# 文档违规记录

## 违规案例 #001
**时间**: 2025-12-15T14:30:00Z
**违规人**: [姓名/ID]
**违规类型**: 严重违规
**违规描述**: 在执行 npm run build 前未更新 TASK_PROGRESS.md
**处理结果**: 暂停权限1天，强制完成文档培训
**改进措施**: 已在项目根目录添加构建前检查脚本
```

### 3. 整改验证流程

**整改要求**:
1. **立即停止**: 停止相关开发工作
2. **文档修复**: 按规范完成所有文档更新
3. **自我检查**: 使用质量检查清单验证
4. **团队审查**: 由技术负责人或文档管理员审查
5. **恢复权限**: 审查通过后恢复开发权限

---

## 🛠️ 工具与自动化

### 1. 文档同步脚本

**pre-build-check.sh** (构建前强制检查):
```bash
#!/bin/bash
echo "🔍 执行构建前文档检查..."

# 检查文档更新时间
if [[ -z "$(find docs/ -name "*.md" -mmin -30)" ]]; then
    echo "❌ 错误: 检测到文档超过30分钟未更新!"
    echo "请先更新 docs/CURRENT_STATUS.md 和 docs/TASK_PROGRESS.md"
    exit 1
fi

# 检查TASK_PROGRESS.md状态
if ! grep -q "当前状态.*进行中\|已完成" docs/TASK_PROGRESS.md; then
    echo "❌ 错误: TASK_PROGRESS.md 状态不明确"
    exit 1
fi

echo "✅ 文档检查通过，可以安全执行构建"
```

### 2. 自动化提醒工具

**git hooks** (提交前检查):
```bash
# .git/hooks/pre-commit
echo "📝 检查文档同步状态..."

# 检查是否有文档更新
if git diff --cached --name-only | grep -q "docs/"; then
    echo "✅ 检测到文档更新，继续提交..."
else
    echo "⚠️ 警告: 未检测到文档更新，请确认是否需要更新文档"
    read -p "是否继续提交? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        exit 1
    fi
fi
```

### 3. 文档质量检查工具

**质量检查脚本** (quality-check.sh):
```bash
#!/bin/bash
echo "🔍 执行文档质量检查..."

# 检查文档完整性
docs=("ARCHITECTURE_WHITEPAPER.md" "FEATURE_SPEC.md" "DEVELOPMENT_RULES.md" "TASK_PROGRESS.md")

for doc in "${docs[@]}"; do
    if [[ ! -f "docs/$doc" ]]; then
        echo "❌ 缺少重要文档: $doc"
        exit 1
    fi
done

# 检查文档格式
for doc in docs/*.md; do
    if ! grep -q "**版本**:" "$doc"; then
        echo "⚠️ 警告: $doc 缺少版本信息"
    fi
done

echo "✅ 文档质量检查完成"
```

---

## 📞 支持与联系方式

### 文档管理团队
- **文档管理员**: 负责文档体系维护和质量检查
- **技术负责人**: 负责技术文档的准确性和完整性
- **项目经理**: 负责项目状态文档的及时更新

### 问题反馈渠道
- **文档问题**: 在项目中创建 issue，标签 `documentation`
- **紧急问题**: 直接联系文档管理员
- **改进建议**: 提交 pull request，标题包含 `[DOC]`

### 培训与支持
- **新员工培训**: 必须完成文档管理规范培训
- **定期培训**: 每月举行文档管理最佳实践分享
- **一对一指导**: 为需要帮助的团队提供个性化指导

---

## 📝 附录

### A. 文档模板

**标准文档模板**:
```markdown
# [文档标题]

**版本**: v1.0
**创建时间**: YYYY-MM-DD
**最后更新**: YYYY-MM-DD
**维护负责人**: [姓名]
**适用范围**: [适用人群]
**状态**: ✅ 完成

---

## 概述

[文档用途和重要性说明]

## 核心内容

[文档主要内容]

## 更新日志

| 日期 | 版本 | 更新内容 | 更新人 |
|------|------|----------|--------|
| YYYY-MM-DD | v1.0 | 初始版本 | [姓名] |

---

**最后更新**: YYYY-MM-DD
**下次审查**: YYYY-MM-DD
```

### B. 检查清单

**每日检查清单**:
- [ ] 文档状态与代码一致
- [ ] TASK_PROGRESS.md 更新到最新
- [ ] CURRENT_STATUS.md 反映当前状态
- [ ] 未完成任务标记明确
- [ ] 下次开发者可快速理解

**发布前检查清单**:
- [ ] 所有相关文档已更新
- [ ] 版本号已更新
- [ ] 变更日志已记录
- [ ] 交叉引用已验证
- [ ] 质量检查已通过

---

**⚠️ 重要提醒**:
这些文档管理与保存规则是保证 ArkOK V2 项目质量和团队协作效率的基石。所有项目参与人员必须严格遵守，违规将承担相应责任。

**🎯 遵循规则，保障质量，提升效率！**

---

*最后更新: 2025-12-15*
*版本: v1.0*