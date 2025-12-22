const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteRecords() {
    const student = await prisma.students.findFirst({
        where: { name: '宁可歆' },
        select: { id: true, name: true }
    });

    if (!student) {
        console.log('未找到学生：宁可歆');
        await prisma.$disconnect();
        return;
    }

    console.log('找到学生:', student.name, 'ID:', student.id);

    // 今天的日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deleted = await prisma.task_records.deleteMany({
        where: {
            studentId: student.id,
            createdAt: { gte: today }  // 只删除今天创建的
        }
    });

    console.log('已删除今天的', deleted.count, '条任务记录');

    await prisma.$disconnect();
}

deleteRecords();
