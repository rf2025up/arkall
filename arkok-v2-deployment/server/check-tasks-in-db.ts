import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTasks() {
  try {
    console.log('=== 检查数据库中的任务分类和内容 ===\n');

    // 检查核心教学法相关分类
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

    // 检查综合成长相关分类
    const growthCategories = [
      '阅读',
      '责任心',
      '协作与创造',
      '家庭联结'
    ];

    console.log('--- 核心教学法分类检查 ---');
    let methodologyTotal = 0;
    for (const category of methodologyCategories) {
      const count = await prisma.taskLibrary.count({
        where: { category: category }
      });
      methodologyTotal += count;
      console.log(`${category}: ${count} 个任务`);

      // 显示该分类下的具体任务
      const tasks = await prisma.taskLibrary.findMany({
        where: { category: category },
        select: { name: true, defaultExp: true }
      });
      tasks.forEach(task => {
        console.log(`  - ${task.name} (${task.defaultExp} EXP)`);
      });
    }
    console.log(`核心教学法总计: ${methodologyTotal} 个任务\n`);

    console.log('--- 综合成长分类检查 ---');
    let growthTotal = 0;
    for (const category of growthCategories) {
      const count = await prisma.taskLibrary.count({
        where: { category: category }
      });
      growthTotal += count;
      console.log(`${category}: ${count} 个任务`);

      // 显示该分类下的具体任务
      const tasks = await prisma.taskLibrary.findMany({
        where: { category: category },
        select: { name: true, defaultExp: true }
      });
      tasks.forEach(task => {
        console.log(`  - ${task.name} (${task.defaultExp} EXP)`);
      });
    }
    console.log(`综合成长总计: ${growthTotal} 个任务\n`);

    // 检查所有分类
    console.log('--- 所有数据库分类 ---');
    const allCategories = await prisma.taskLibrary.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    allCategories.forEach(item => {
      console.log(`${item.category}: ${item._count.category} 个任务`);
    });

    console.log(`\n数据库总任务数: ${await prisma.taskLibrary.count()}`);

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasks();