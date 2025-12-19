import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugTaskLibrary() {
  try {
    console.log('=== 调试任务库数据 ===\n');

    // 获取所有任务
    const allTasks = await prisma.taskLibrary.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        defaultExp: true,
        type: true,
        isActive: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    console.log(`数据库总任务数: ${allTasks.length}`);
    console.log('\n--- 按分类统计 ---');

    const categoryStats = allTasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {});

    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`${category}: ${count} 个任务`);
    });

    console.log('\n--- 所有任务详情 ---');
    allTasks.forEach((task, index) => {
      console.log(`${index + 1}. [${task.category}] ${task.name} (${task.defaultExp} EXP)`);
    });

    // 检查特色教学法相关分类
    const methodologyCategories = [
      '基础学习方法论',
      '数学思维与解题策略',
      '语文学科能力深化',
      '英语应用与输出',
      '阅读深度与分享',
      '自主学习与规划',
      '课堂互动与深度参与',
      '家庭联结与知识迁移',
      '高阶输出与创新'
    ];

    const methodologyTasks = allTasks.filter(task =>
      methodologyCategories.includes(task.category)
    );

    console.log(`\n--- 特色教学法任务匹配结果 ---`);
    console.log(`期望分类: ${methodologyCategories.join(', ')}`);
    console.log(`匹配任务数: ${methodologyTasks.length}`);

    if (methodologyTasks.length === 0) {
      console.log('❌ 没有找到任何特色教学法任务！');
      console.log('🔍 建议检查数据库中的实际分类名称');
    }

    // 检查综合成长任务
    const growthTasks = allTasks.filter(task => task.category === '综合成长');
    console.log(`\n--- 综合成长任务匹配结果 ---`);
    console.log(`匹配任务数: ${growthTasks.length}`);

    if (growthTasks.length === 0) {
      console.log('❌ 没有找到综合成长任务！');
    }

  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTaskLibrary();