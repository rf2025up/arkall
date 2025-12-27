const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryNikexinRecords() {
  try {
    // 1. 查找宁可歆学生
    const students = await prisma.students.findMany({
      where: {
        name: { contains: '宁可歆' }
      },
      select: {
        id: true,
        name: true,
        exp: true,
        points: true,
        schoolId: true
      }
    });

    console.log('\n找到的学生信息:');
    console.table(students);

    if (students.length === 0) {
      console.log('未找到宁可歆学生');
      return;
    }

    const student = students[0];
    console.log(`\n查询学生 ${student.name} (ID: ${student.id}) 的加分记录...\n`);

    // 2. 查询该学生的所有 task_records
    const records = await prisma.task_records.findMany({
      where: {
        studentId: student.id,
        expAwarded: { gt: 0 }
      },
      select: {
        id: true,
        type: true,
        task_category: true,
        title: true,
        expAwarded: true,
        status: true,
        createdAt: true,
        content: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n共找到 ${records.length} 条加分记录:\n`);

    // 按类型分组统计
    const stats = {};
    records.forEach(r => {
      const key = `${r.type}/${r.task_category || 'N/A'}`;
      if (!stats[key]) {
        stats[key] = { count: 0, totalExp: 0 };
      }
      stats[key].count++;
      stats[key].totalExp += r.expAwarded;
    });

    console.log('按类型分组统计:');
    console.table(stats);

    // 显示大额加分记录 (>100 exp)
    const largeRewards = records.filter(r => r.expAwarded > 100);
    if (largeRewards.length > 0) {
      console.log(`\n大额加分记录 (>100 exp), 共 ${largeRewards.length} 条:`);
      largeRewards.forEach(r => {
        console.log(`- ${r.createdAt.toISOString()} | ${r.type}/${r.task_category || 'N/A'} | +${r.expAwarded} exp | ${r.title}`);
        if (r.content) {
          console.log(`  内容: ${JSON.stringify(r.content).substring(0, 200)}...`);
        }
      });
    }

    // 显示所有加分记录（最近50条）
    console.log(`\n最近50条加分记录:`);
    const recentRecords = records.slice(0, 50);
    recentRecords.forEach((r, i) => {
      console.log(`${i + 1}. ${r.createdAt.toLocaleString('zh-CN')} | ${r.type}/${r.task_category || 'N/A'} | +${r.expAwarded.toString().padStart(4)} exp | ${r.title}`);
    });

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryNikexinRecords();
