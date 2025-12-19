/**
 * 📚 核心教学法任务分析与分类脚本
 * 将数据库中的核心教学法任务按照9大教学法维度进行智能分类
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 定义9大教学法维度的分类规则
const METHODOLOGY_CATEGORIES = {
  '基础学习方法论': [
    '作业的自主检查',
    '错题的红笔订正',
    '错题的摘抄与归因',
    '用"三色笔法"整理作业',
    '自评当日作业质量'
  ],
  '数学思维与解题策略': [
    '5道旧错题的重做练习',
    '一项老师定制的数学拓展任务',
    '一道"说题"练习',
    '找一道生活中的数学问题',
    '高阶：母题归纳',
    '高阶：错题主动重做',
    '高阶：应用解题模型表'
  ],
  '语文学科能力深化': [
    '仿写课文中的一个好句',
    '为当天生字编顺口溜或故事',
    '运用阅读理解解题模板',
    '查字典（查一查·读一读）',
    '分类组词与辨析（组一组·辨一辨）',
    '联想记忆法（想一想·记一记）'
  ],
  '英语应用与输出': [
    '用今日单词编小对话',
    '制作单词卡'
  ],
  '阅读深度与分享': [
    '好词金句赏析',
    '画人物关系图/预测情节',
    '录制阅读小分享'
  ],
  '自主学习与规划': [
    '自主规划"复习"任务',
    '自主规划"预习"任务',
    '制定学习小计划',
    '设定并完成改进目标'
  ],
  '课堂互动与深度参与': [
    '主动举手回答问题',
    '每节课准备一个问题',
    '主动申请课堂角色',
    '记录老师金句并写理解',
    '帮助同桌理解知识点'
  ],
  '家庭联结与知识迁移': [
    '向家长讲解学习方法',
    '教家人一个新知识',
    '主动展示复习成果',
    '分享"改进目标"完成情况',
    '用数学解决家庭问题'
  ],
  '高阶输出与创新': [
    '录制"小老师"视频'
  ]
};

async function analyzeMethodologyTasks() {
  try {
    console.log('=== 核心教学法任务分析 ===\n');

    // 1. 获取所有核心教学法任务
    const methodologyTasks = await prisma.taskLibrary.findMany({
      where: {
        category: '核心教学法',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        defaultExp: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 数据库中核心教学法任务总数: ${methodologyTasks.length}`);
    console.log('📋 所有核心教学法任务列表:');
    methodologyTasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.name} (${task.defaultExp} EXP)`);
    });

    // 2. 按照教学白皮书标准进行分类
    const categorizedTasks = {} as Record<string, any[]>;

    // 初始化所有分类
    Object.keys(METHODOLOGY_CATEGORIES).forEach(category => {
      categorizedTasks[category] = [];
    });

    // 智能匹配任务到分类
    methodologyTasks.forEach(task => {
      let matched = false;

      // 精确匹配
      for (const [category, taskNames] of Object.entries(METHODOLOGY_CATEGORIES)) {
        if (taskNames.includes(task.name)) {
          categorizedTasks[category].push(task);
          matched = true;
          console.log(`✅ 精确匹配: "${task.name}" → ${category}`);
          break;
        }
      }

      // 模糊匹配（如果精确匹配失败）
      if (!matched) {
        const taskName = task.name.toLowerCase();

        // 基于关键词的模糊匹配
        if (taskName.includes('自主检查') || taskName.includes('订正') || taskName.includes('错题') || taskName.includes('三色笔') || taskName.includes('自评')) {
          categorizedTasks['基础学习方法论'].push(task);
          console.log(`🔍 模糊匹配: "${task.name}" → 基础学习方法论`);
        } else if (taskName.includes('数学') || taskName.includes('解题') || taskName.includes('母题') || taskName.includes('说题')) {
          categorizedTasks['数学思维与解题策略'].push(task);
          console.log(`🔍 模糊匹配: "${task.name}" → 数学思维与解题策略`);
        } else if (taskName.includes('语文') || taskName.includes('生字') || taskName.includes('仿写') || taskName.includes('记忆') || taskName.includes('查字典')) {
          categorizedTasks['语文学科能力深化'].push(task);
          console.log(`🔍 模糊匹配: "${task.name}" → 语文学科能力深化`);
        } else if (taskName.includes('英语') || taskName.includes('单词') || taskName.includes('对话')) {
          categorizedTasks['英语应用与输出'].push(task);
          console.log(`🔍 模糊匹配: "${task.name}" → 英语应用与输出`);
        } else if (taskName.includes('阅读') || taskName.includes('金句') || taskName.includes('赏析') || taskName.includes('录制')) {
          categorizedTasks['阅读深度与分享'].push(task);
          console.log(`🔍 模糊匹配: "${task.name}" → 阅读深度与分享`);
        } else if (taskName.includes('自主规划') || taskName.includes('预习') || taskName.includes('复习') || taskName.includes('计划') || taskName.includes('目标')) {
          categorizedTasks['自主学习与规划'].push(task);
          console.log(`🔍 模糊匹配: "${task.name}" → 自主学习与规划`);
        } else if (taskName.includes('课堂') || taskName.includes('举手') || taskName.includes('金句') || taskName.includes('帮助同桌') || taskName.includes('准备问题')) {
          categorizedTasks['课堂互动与深度参与'].push(task);
          console.log(`🔍 模糊匹配: "${task.name}" → 课堂互动与深度参与`);
        } else if (taskName.includes('家长') || taskName.includes('家人') || taskName.includes('家庭') || taskName.includes('分享')) {
          categorizedTasks['家庭联结与知识迁移'].push(task);
          console.log(`🔍 模糊匹配: "${task.name}" → 家庭联结与知识迁移`);
        } else if (taskName.includes('小老师') || taskName.includes('视频') || taskName.includes('高阶')) {
          categorizedTasks['高阶输出与创新'].push(task);
          console.log(`🔍 模糊匹配: "${task.name}" → 高阶输出与创新`);
        } else {
          // 兜底分类
          categorizedTasks['基础学习方法论'].push(task);
          console.log(`❓ 兜底分类: "${task.name}" → 基础学习方法论`);
        }
      }
    });

    // 3. 生成分类报告
    console.log('\n=== 9大教学法维度分类结果 ===');
    let totalCategorized = 0;

    Object.entries(categorizedTasks).forEach(([category, tasks]) => {
      console.log(`\n📚 ${category} (${tasks.length}个任务):`);
      if (tasks.length === 0) {
        console.log('  ⚠️ 该分类暂无任务');
      } else {
        tasks.forEach(task => {
          console.log(`  - ${task.name} (${task.defaultExp} EXP)`);
        });
        totalCategorized += tasks.length;
      }
    });

    console.log(`\n📊 分类统计:`);
    console.log(`  - 总任务数: ${methodologyTasks.length}`);
    console.log(`  - 已分类任务: ${totalCategorized}`);
    console.log(`  - 分类覆盖率: ${((totalCategorized / methodologyTasks.length) * 100).toFixed(1)}%`);

    // 4. 生成前端需要的分类映射数据
    console.log('\n=== 前端分类映射数据 ===');
    const frontendMapping = Object.entries(categorizedTasks).map(([category, tasks]) => ({
      category,
      tasks: tasks.map(task => ({
        id: task.id,
        name: task.name,
        defaultExp: task.defaultExp,
        description: task.description
      }))
    }));

    console.log('前端可用数据结构:');
    console.log(JSON.stringify(frontendMapping, null, 2));

  } catch (error) {
    console.error('❌ 分析失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行分析
analyzeMethodologyTasks()
  .then(() => {
    console.log('\n✅ 核心教学法任务分析完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 分析失败:', error);
    process.exit(1);
  });