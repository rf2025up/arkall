"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanDuplicateTasks = cleanDuplicateTasks;
exports.databaseHealthCheck = databaseHealthCheck;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * 🧹 数据清洗脚本：清理重复的任务记录
 *
 * 逻辑：
 * 1. 按学生+任务标题+类型+日期分组
 * 2. 保留最新的记录，删除旧的重复记录
 * 3. 输出清洗统计报告
 */
async function cleanDuplicateTasks() {
    console.log('🧹 [CLEANUP] 开始清理重复任务记录...');
    try {
        // 🔍 第一步：查找所有重复的任务记录
        console.log('🔍 [CLEANUP] 第1步：查找重复任务记录...');
        const duplicateGroups = await prisma.$queryRaw `
      SELECT
        "studentId",
        title,
        type,
        DATE("createdAt") as task_date,
        COUNT(*) as duplicate_count,
        MAX("createdAt") as latest_created_at,
        STRING_AGG(id::text, ', ' ORDER BY "createdAt" DESC) as all_ids
      FROM task_records
      WHERE "schoolId" IS NOT NULL
      GROUP BY "studentId", title, type, DATE("createdAt")
      HAVING COUNT(*) > 1
      ORDER BY task_date DESC, duplicate_count DESC;
    `;
        const groups = duplicateGroups;
        console.log(`🔍 [CLEANUP] 发现 ${groups.length} 组重复任务记录`);
        if (groups.length === 0) {
            console.log('✅ [CLEANUP] 未发现重复任务记录，数据库已是干净的！');
            return;
        }
        // 📊 第二步：显示重复任务详情
        console.log('📊 [CLEANUP] 第2步：重复任务详情分析...');
        let totalDuplicatesToDelete = 0;
        groups.forEach((group, index) => {
            const ids = group.all_ids.split(', ');
            const idsToDelete = ids.slice(1); // 保留最新的（第一个），删除其他
            totalDuplicatesToDelete += idsToDelete.length;
            console.log(`📋 [CLEANUP] 重复组 ${index + 1}:`);
            console.log(`   - 学生ID: ${group.student_id}`);
            console.log(`   - 任务: ${group.title} (${group.type})`);
            console.log(`   - 日期: ${group.task_date}`);
            console.log(`   - 重复数量: ${group.duplicate_count}`);
            console.log(`   - 将删除: ${idsToDelete.length} 条记录`);
            console.log(`   - 保留ID: ${ids[0]}`);
        });
        // ⚠️ 第三步：确认删除操作
        console.log('⚠️ [CLEANUP] 第3步：准备删除重复记录...');
        console.log(`🗑️  总计将删除 ${totalDuplicatesToDelete} 条重复任务记录`);
        // 🛑 安全检查：如果重复记录过多，要求确认
        if (totalDuplicatesToDelete > 1000) {
            console.error('🚨 [CLEANUP] 重复记录数量过多 (${totalDuplicatesToDelete})，请人工确认后再继续');
            return;
        }
        // 🗑️ 第四步：执行删除操作
        console.log('🗑️ [CLEANUP] 第4步：执行删除操作...');
        let deletedCount = 0;
        for (const group of groups) {
            const ids = group.all_ids.split(', ');
            const idsToDelete = ids.slice(1); // 保留最新的
            for (const id of idsToDelete) {
                try {
                    await prisma.taskRecord.delete({
                        where: { id }
                    });
                    deletedCount++;
                    if (deletedCount % 10 === 0) {
                        console.log(`🔄 [CLEANUP] 已删除 ${deletedCount} 条记录...`);
                    }
                }
                catch (error) {
                    console.error(`❌ [CLEANUP] 删除记录 ${id} 失败:`, error);
                }
            }
        }
        // ✅ 第五步：验证清理结果
        console.log('✅ [CLEANUP] 第5步：验证清理结果...');
        const remainingDuplicates = await prisma.$queryRaw `
      SELECT COUNT(*) as count
      FROM (
        SELECT
          "studentId",
          title,
          type,
          DATE("createdAt") as task_date
        FROM task_records
        WHERE "schoolId" IS NOT NULL
        GROUP BY "studentId", title, type, DATE("createdAt")
        HAVING COUNT(*) > 1
      ) as remaining;
    `;
        const remainingCount = parseInt(remainingDuplicates[0]?.count || '0');
        // 📈 最终统计报告
        console.log('📈 [CLEANUP] 🧹 数据清洗完成！');
        console.log('='.repeat(50));
        console.log(`✅ 成功删除重复记录: ${deletedCount} 条`);
        console.log(`📊 剩余重复组数: ${remainingCount} 组`);
        console.log(`🎯 清理成功率: ${remainingCount === 0 ? '100%' : `${((deletedCount / totalDuplicatesToDelete) * 100).toFixed(1)}%`}`);
        if (remainingCount > 0) {
            console.log('⚠️ 仍有重复记录未清理，请检查数据完整性');
        }
        else {
            console.log('🎉 数据库已完全清理，无重复任务记录！');
        }
        // 📋 额外统计：当前任务记录总数
        const totalTaskRecords = await prisma.taskRecord.count();
        console.log(`📋 当前任务记录总数: ${totalTaskRecords}`);
    }
    catch (error) {
        console.error('❌ [CLEANUP] 数据清洗过程中发生错误:', error);
        throw error;
    }
}
/**
 * 🔍 数据库健康检查
 */
async function databaseHealthCheck() {
    console.log('🔍 [HEALTH_CHECK] 执行数据库健康检查...');
    try {
        // 基本统计
        const totalSchools = await prisma.school.count();
        const totalStudents = await prisma.student.count({ where: { isActive: true } });
        const totalTaskRecords = await prisma.taskRecord.count();
        const todayTaskRecords = await prisma.taskRecord.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }
        });
        console.log('📊 [HEALTH_CHECK] 数据库统计:');
        console.log(`   - 学校数量: ${totalSchools}`);
        console.log(`   - 活跃学生数: ${totalStudents}`);
        console.log(`   - 任务记录总数: ${totalTaskRecords}`);
        console.log(`   - 今日任务记录数: ${todayTaskRecords}`);
        // 检查最近7天的任务分布
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentTasks = await prisma.taskRecord.groupBy({
            by: ['status'],
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            _count: {
                status: true
            }
        });
        console.log('📈 [HEALTH_CHECK] 最近7天任务状态分布:');
        recentTasks.forEach(stat => {
            console.log(`   - ${stat.status}: ${stat._count.status} 条`);
        });
    }
    catch (error) {
        console.error('❌ [HEALTH_CHECK] 健康检查失败:', error);
    }
}
/**
 * 🚀 主执行函数
 */
async function main() {
    const startTime = Date.now();
    console.log('🚀 [START] 开始执行ArkOK V2数据清洗任务');
    console.log('⏰ 开始时间:', new Date().toISOString());
    console.log('='.repeat(60));
    try {
        // 1. 执行健康检查
        await databaseHealthCheck();
        console.log('');
        // 2. 执行重复数据清理
        await cleanDuplicateTasks();
        console.log('');
        // 3. 再次执行健康检查，对比结果
        console.log('🔄 [FINAL_CHECK] 清理后健康检查...');
        await databaseHealthCheck();
    }
    catch (error) {
        console.error('❌ [FATAL] 数据清洗任务失败:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
        const duration = Date.now() - startTime;
        console.log('');
        console.log('⏰ 任务完成时间:', new Date().toISOString());
        console.log(`⏱️  总耗时: ${(duration / 1000).toFixed(2)} 秒`);
        console.log('🎯 数据清洗任务结束');
    }
}
// 执行主函数
if (require.main === module) {
    main();
}
//# sourceMappingURL=clean_duplicate_tasks.js.map