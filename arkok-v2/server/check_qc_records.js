const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const studentId = '31895b6e-8fb0-4eb8-838c-3c0d3d71bbcb';
    const today = new Date().toISOString().split('T')[0];

    console.log(`🔍 检查学生 ${studentId} 在 ${today} 的QC任务记录:`);

    const records = await prisma.taskRecord.findMany({
      where: {
        studentId: studentId,
        type: 'QC',
        createdAt: {
          gte: new Date(today + 'T00:00:00.000Z'),
          lt: new Date(today + 'T23:59:59.999Z')
        }
      },
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        createdAt: true
      }
    });

    console.log(`找到 ${records.length} 条QC记录:`);
    records.forEach(record => {
      console.log(`  - ID: ${record.id}`);
      console.log(`    状态: ${record.status}`);
      console.log(`    任务: ${record.title}`);
      console.log(`    类型: ${record.type}`);
      console.log('');
    });

    // 同时检查今天的所有任务记录
    const allRecords = await prisma.taskRecord.findMany({
      where: {
        studentId: studentId,
        createdAt: {
          gte: new Date(today + 'T00:00:00.000Z'),
          lt: new Date(today + 'T23:59:59.999Z')
        }
      },
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        createdAt: true
      }
    });

    console.log(`\n总计 ${allRecords.length} 条今日任务记录:`);
    allRecords.forEach(record => {
      console.log(`  - ${record.type}: ${record.id} (${record.status}) - ${record.title}`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();