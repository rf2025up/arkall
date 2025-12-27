const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeNikexinRecords() {
  try {
    const studentName = '宁可歆';

    // 查找宁可歆学生
    const students = await prisma.students.findMany({
      where: { name: { contains: studentName } }
    });

    if (students.length === 0) {
      console.log('未找到该学生');
      return;
    }

    const student = students[0];
    console.log(`\n学生信息:`);
    console.log(`- 姓名: ${student.name}`);
    console.log(`- ID: ${student.id}`);
    console.log(`- 当前经验: ${student.exp}`);
    console.log(`- 当前积分: ${student.points}`);
    console.log(`- 等级: ${student.level}`);
    console.log(`- 创建时间: ${student.createdAt}`);
    console.log(`- 更新时间: ${student.updatedAt}`);

    // 查询所有 task_records（包括 expAwarded = 0 的记录）
    const allRecords = await prisma.task_records.findMany({
      where: { studentId: student.id },
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

    console.log(`\n共找到 ${allRecords.length} 条记录（包括 0 exp 的记录）`);

    // 按日期统计每日获得的 exp
    const dailyExp = {};
    allRecords.forEach(r => {
      const dateKey = r.createdAt.toISOString().split('T')[0];
      dailyExp[dateKey] = (dailyExp[dateKey] || 0) + (r.expAwarded || 0);
    });

    console.log('\n每日 exp 获得统计（按日期降序）:');
    const sortedDates = Object.keys(dailyExp).sort((a, b) => b.localeCompare(a));
    sortedDates.forEach(date => {
      console.log(`${date}: +${dailyExp[date]} exp`);
    });

    // 查找单日大额加分（>200 exp）
    console.log('\n单日大额加分日期（>200 exp）:');
    sortedDates.filter(d => dailyExp[d] > 200).forEach(date => {
      console.log(`${date}: +${dailyExp[date]} exp`);

      // 显示当天的详细记录
      const daysRecords = allRecords.filter(r =>
        r.createdAt.toISOString().split('T')[0] === date
      );
      console.log('  详细记录:');
      daysRecords.forEach(r => {
        console.log(`    - ${r.createdAt.toLocaleTimeString('zh-CN')} | ${r.type}/${r.task_category || 'N/A'} | +${r.expAwarded} exp | ${r.title}`);
      });
    });

    // 检查是否有批量导入的情况
    const timestamps = allRecords.map(r => r.createdAt.getTime());
    const timeGroups = {};

    timestamps.forEach((ts, i) => {
      // 将时间戳按10秒分组
      const groupKey = Math.floor(ts / 10000);
      if (!timeGroups[groupKey]) {
        timeGroups[groupKey] = [];
      }
      timeGroups[groupKey].push(allRecords[i]);
    });

    console.log('\n批量操作分析（10秒内创建的记录）:');
    Object.keys(timeGroups)
      .sort((a, b) => b - a)
      .forEach(groupKey => {
        const group = timeGroups[groupKey];
        if (group.length > 5) { // 超过5条记录视为批量操作
          const totalExp = group.reduce((sum, r) => sum + (r.expAwarded || 0), 0);
          const firstRecord = group[0];
          console.log(`\n时间: ${firstRecord.createdAt.toLocaleString('zh-CN')}`);
          console.log(`数量: ${group.length} 条记录`);
          console.log(`总 exp: +${totalExp}`);
          console.log(`类型分布:`);

          const typeCount = {};
          group.forEach(r => {
            const key = `${r.type}/${r.task_category || 'N/A'}`;
            typeCount[key] = (typeCount[key] || 0) + 1;
          });
          Object.entries(typeCount).forEach(([type, count]) => {
            console.log(`  - ${type}: ${count} 条`);
          });
        }
      });

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeNikexinRecords();
