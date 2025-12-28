/**
 * 诊断脚本：检查今日任务和学生经验状态
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log('🔍 诊断开始...\n');

        // 获取北京时间今日日期
        const now = new Date();
        const beijingOffset = 8 * 60;
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const beijingTime = new Date(utcTime + (beijingOffset * 60000));
        const todayStr = `${beijingTime.getFullYear()}-${String(beijingTime.getMonth() + 1).padStart(2, '0')}-${String(beijingTime.getDate()).padStart(2, '0')}`;

        console.log(`📅 当前日期（北京时间）: ${todayStr}\n`);

        // 1. 查找今日创建的所有任务记录
        const startOfDay = new Date(`${todayStr}T00:00:00+08:00`);
        const endOfDay = new Date(`${todayStr}T23:59:59+08:00`);

        const todayTasks = await prisma.task_records.findMany({
            where: {
                createdAt: { gte: startOfDay, lte: endOfDay }
            },
            select: {
                id: true,
                studentId: true,
                title: true,
                status: true,
                expAwarded: true,
                settledAt: true,
                content: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        console.log(`📋 今日创建的任务记录数: ${todayTasks.length}\n`);

        // 统计各状态数量
        const statusCount = { PENDING: 0, COMPLETED: 0, SUBMITTED: 0 };
        const settledCount = { settled: 0, unsettled: 0 };
        let totalExpInTasks = 0;

        todayTasks.forEach(t => {
            statusCount[t.status] = (statusCount[t.status] || 0) + 1;
            if (t.settledAt) settledCount.settled++;
            else settledCount.unsettled++;
            if (t.status === 'COMPLETED') totalExpInTasks += t.expAwarded;
        });

        console.log('📊 任务状态统计:');
        console.log(`   - PENDING: ${statusCount.PENDING}`);
        console.log(`   - COMPLETED: ${statusCount.COMPLETED}`);
        console.log(`   - 其他: ${statusCount.SUBMITTED || 0}\n`);

        console.log('📊 结算状态统计:');
        console.log(`   - 已结算(settledAt有值): ${settledCount.settled}`);
        console.log(`   - 未结算(settledAt为null): ${settledCount.unsettled}\n`);

        console.log(`💰 今日COMPLETED任务的总经验值: ${totalExpInTasks}\n`);

        // 2. 检查学生的经验值
        const students = await prisma.students.findMany({
            where: { isActive: true },
            select: { id: true, name: true, exp: true, className: true },
            orderBy: { name: 'asc' }
        });

        console.log('👥 学生经验值列表 (前20位):');
        students.slice(0, 20).forEach(s => {
            console.log(`   - ${s.name} (${s.className || '未分班'}): ${s.exp} EXP`);
        });
        console.log('');

        // 3. 检查是否有结算汇总记录
        const summaryRecords = await prisma.task_records.findMany({
            where: {
                title: { contains: '结算' }
            },
            select: {
                id: true,
                studentId: true,
                title: true,
                content: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log(`📝 最近的结算汇总记录: ${summaryRecords.length}\n`);
        summaryRecords.forEach(r => {
            const content = r.content || {};
            console.log(`   - ${r.title}: 经验=${content.totalExpAwarded || 0}, 日期=${content.taskDate || '无'}`);
        });

        console.log('\n✅ 诊断完成');

    } catch (error) {
        console.error('❌ 诊断出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
