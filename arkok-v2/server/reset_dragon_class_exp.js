/**
 * 重置龙老师班级学生经验值脚本
 * 用途：只重置龙老师班级学生的经验值，其他班级不受影响
 * 
 * 使用方法：node reset_dragon_class_exp.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDragonClassExp() {
    try {
        console.log('🔄 开始重置龙老师班级学生经验值...\n');

        // 1. 查找龙老师
        const teacher = await prisma.teachers.findFirst({
            where: {
                OR: [
                    { name: { contains: '龙' } },
                    { displayName: { contains: '龙' } }
                ]
            },
            select: { id: true, name: true, displayName: true }
        });

        if (!teacher) {
            console.log('❌ 未找到龙老师，请检查老师名称');
            return;
        }

        console.log(`👨‍🏫 找到老师: ${teacher.displayName || teacher.name} (ID: ${teacher.id})\n`);

        // 2. 获取龙老师班级的学生
        const students = await prisma.students.findMany({
            where: {
                teacherId: teacher.id,
                isActive: true
            },
            select: { id: true, name: true, exp: true, className: true },
            orderBy: { name: 'asc' }
        });

        console.log(`📋 找到 ${students.length} 位学生\n`);

        if (students.length === 0) {
            console.log('⚠️ 该老师名下没有学生');
            return;
        }

        // 显示当前状态
        console.log('📊 当前经验值状态:');
        let totalExp = 0;
        students.forEach(s => {
            console.log(`   - ${s.name} (${s.className || '未分班'}): ${s.exp} EXP`);
            totalExp += s.exp;
        });
        console.log(`\n💰 总经验值: ${totalExp}\n`);

        const studentIds = students.map(s => s.id);

        // 3. 重置这些学生的经验为 0
        console.log('🔄 正在重置经验值为 0...');
        const result = await prisma.students.updateMany({
            where: { id: { in: studentIds } },
            data: {
                exp: 0,
                updatedAt: new Date()
            }
        });
        console.log(`✅ 已重置 ${result.count} 位学生的经验值\n`);

        // 4. 删除这些学生的结算汇总记录
        console.log('🗑️ 正在删除结算汇总记录...');
        const deleteSummary = await prisma.task_records.deleteMany({
            where: {
                studentId: { in: studentIds },
                title: { contains: '结算' }
            }
        });
        console.log(`✅ 已删除 ${deleteSummary.count} 条结算汇总记录\n`);

        // 5. 重置这些学生任务的 settledAt 状态
        console.log('🔄 正在重置任务结算状态...');
        const resetSettled = await prisma.task_records.updateMany({
            where: {
                studentId: { in: studentIds },
                settledAt: { not: null }
            },
            data: {
                settledAt: null
            }
        });
        console.log(`✅ 已重置 ${resetSettled.count} 条任务的 settledAt 状态\n`);

        console.log('🎉 重置完成！龙老师班级学生经验已清零，其他班级不受影响。');

    } catch (error) {
        console.error('❌ 重置过程中出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 运行脚本
resetDragonClassExp();
