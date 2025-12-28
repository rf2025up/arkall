/**
 * 重置学生经验值脚本
 * 用途：将所有学生的经验值重置为0（或指定值）
 * 
 * 使用方法：node reset_student_exp.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetStudentExp() {
    try {
        console.log('🔄 开始重置学生经验值...\n');

        // 1. 获取当前学生经验状态
        const students = await prisma.students.findMany({
            where: { isActive: true },
            select: { id: true, name: true, exp: true, className: true },
            orderBy: { name: 'asc' }
        });

        console.log(`📋 找到 ${students.length} 位活跃学生\n`);

        // 显示当前状态
        console.log('📊 当前经验值状态:');
        let totalExp = 0;
        students.forEach(s => {
            console.log(`   - ${s.name}: ${s.exp} EXP`);
            totalExp += s.exp;
        });
        console.log(`\n💰 总经验值: ${totalExp}\n`);

        // 2. 重置所有学生经验为 0
        console.log('🔄 正在重置经验值为 0...');
        const result = await prisma.students.updateMany({
            where: { isActive: true },
            data: {
                exp: 0,
                updatedAt: new Date()
            }
        });
        console.log(`✅ 已重置 ${result.count} 位学生的经验值\n`);

        // 3. 删除所有结算汇总记录
        console.log('🗑️ 正在删除结算汇总记录...');
        const deleteSummary = await prisma.task_records.deleteMany({
            where: {
                title: { contains: '结算' }
            }
        });
        console.log(`✅ 已删除 ${deleteSummary.count} 条结算汇总记录\n`);

        // 4. 重置所有任务的 settledAt 状态
        console.log('🔄 正在重置所有任务的结算状态...');
        const resetSettled = await prisma.task_records.updateMany({
            where: {
                settledAt: { not: null }
            },
            data: {
                settledAt: null
            }
        });
        console.log(`✅ 已重置 ${resetSettled.count} 条任务的 settledAt 状态\n`);

        console.log('🎉 重置完成！所有学生经验已清零，可以重新开始测试。');

    } catch (error) {
        console.error('❌ 重置过程中出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 运行脚本
resetStudentExp();
