/**
 * 清除今日经验加分脚本
 * 用途：将今日已结算的经验值从学生账户中扣除，并重置任务的 settledAt 状态
 * 
 * 使用方法：node clear_today_exp.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTodayExp() {
    try {
        console.log('🔄 开始清除今日经验加分...\n');

        // 获取北京时间今日日期
        const now = new Date();
        const beijingOffset = 8 * 60;
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const beijingTime = new Date(utcTime + (beijingOffset * 60000));
        const todayStr = `${beijingTime.getFullYear()}-${String(beijingTime.getMonth() + 1).padStart(2, '0')}-${String(beijingTime.getDate()).padStart(2, '0')}`;

        console.log(`📅 当前日期（北京时间）: ${todayStr}\n`);

        // 1. 查找今日已结算的任务记录
        const settledTasks = await prisma.task_records.findMany({
            where: {
                settledAt: { not: null },
                content: {
                    path: ['taskDate'],
                    equals: todayStr
                }
            },
            select: {
                id: true,
                studentId: true,
                expAwarded: true,
                title: true,
                settledAt: true
            }
        });

        console.log(`📋 找到 ${settledTasks.length} 条今日已结算的任务记录\n`);

        if (settledTasks.length === 0) {
            console.log('✅ 今日没有已结算的任务，无需清除。');
            return;
        }

        // 2. 按学生分组计算需要扣除的经验
        const expByStudent = new Map();
        settledTasks.forEach(task => {
            const current = expByStudent.get(task.studentId) || 0;
            expByStudent.set(task.studentId, current + task.expAwarded);
        });

        console.log('📊 各学生需要扣除的经验:');
        for (const [studentId, exp] of expByStudent) {
            const student = await prisma.students.findUnique({
                where: { id: studentId },
                select: { name: true, exp: true }
            });
            console.log(`   - ${student?.name || studentId}: 当前 ${student?.exp || 0} EXP，扣除 ${exp} EXP`);
        }
        console.log('');

        // 3. 批量扣除学生经验
        console.log('💰 正在扣除经验...');
        for (const [studentId, exp] of expByStudent) {
            await prisma.students.update({
                where: { id: studentId },
                data: {
                    exp: { decrement: exp },
                    updatedAt: new Date()
                }
            });
        }
        console.log(`✅ 已从 ${expByStudent.size} 位学生账户中扣除经验\n`);

        // 4. 重置任务的 settledAt 状态
        console.log('🔄 正在重置任务结算状态...');
        const resetResult = await prisma.task_records.updateMany({
            where: {
                id: { in: settledTasks.map(t => t.id) }
            },
            data: {
                settledAt: null
            }
        });
        console.log(`✅ 已重置 ${resetResult.count} 条任务的 settledAt 状态\n`);

        // 5. 删除今日的结算汇总记录
        console.log('🗑️ 正在删除结算汇总记录...');
        const deleteSummary = await prisma.task_records.deleteMany({
            where: {
                title: '当日学业全面过关结算',
                content: {
                    path: ['taskDate'],
                    equals: todayStr
                }
            }
        });
        console.log(`✅ 已删除 ${deleteSummary.count} 条结算汇总记录\n`);

        console.log('🎉 清除完成！今日所有经验加分已回滚。');

    } catch (error) {
        console.error('❌ 清除过程中出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 运行脚本
clearTodayExp();
