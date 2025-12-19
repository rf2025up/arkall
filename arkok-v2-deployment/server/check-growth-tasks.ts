import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGrowthTasks() {
  try {
    const growthTasks = await prisma.taskLibrary.findMany({
      where: { category: '综合成长' },
      select: { name: true, defaultExp: true }
    });

    console.log('综合成长分类下的任务:');
    growthTasks.forEach(task => {
      console.log(`- ${task.name} (${task.defaultExp} EXP)`);
    });
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGrowthTasks();