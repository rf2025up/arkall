const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const student = await prisma.students.findFirst({
        where: { name: { contains: '宁可歆' } },
        select: { id: true }
    });

    // 查看今天的任务
    const todayTasks = await prisma.task_records.findMany({
        where: {
            studentId: student.id,
            content: { path: ['taskDate'], equals: '2025-12-27' }
        },
        select: { title: true, status: true, settledAt: true, expAwarded: true }
    });
    console.log('今日任务数:', todayTasks.length);
    let totalExp = 0;
    todayTasks.forEach(t => {
        const done = t.status === 'COMPLETED' || t.status === 'PASSED';
        if (done && !t.settledAt) totalExp += t.expAwarded;
        console.log(`  - ${t.title}: status=${t.status}, settled=${t.settledAt ? 'Y' : 'N'}, exp=${t.expAwarded}`);
    });
    console.log('未结算经验总计:', totalExp);

    await prisma.$disconnect();
}
check();
