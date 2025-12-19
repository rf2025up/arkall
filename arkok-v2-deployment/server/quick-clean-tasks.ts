import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🧹 快速数据清洗脚本 - 专门处理龙老师结算页重复任务
 */
async function quickCleanTasks() {
  console.log('🧹 [QUICK_CLEAN] 开始快速清洗重复任务记录...');

  try {
    // 🔍 第一步：查看当前任务记录总数
    const totalTasks = await prisma.taskRecord.count();
    console.log(`📊 [QUICK_CLEAN] 当前任务记录总数: ${totalTasks}`);

    // 🔍 第二步：查看今天的任务记录数
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const todayTasks = await prisma.taskRecord.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });
    console.log(`📊 [QUICK_CLEAN] 今日任务记录数: ${todayTasks}`);

    // 🔍 第三步：查找重复的任务记录（使用Prisma查询而不是原始SQL）
    console.log('🔍 [QUICK_CLEAN] 查找重复任务记录...');

    // 获取今天的所有任务记录
    const allTasks = await prisma.taskRecord.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      select: {
        id: true,
        studentId: true,
        title: true,
        type: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 手动分组查找重复
    const taskGroups = new Map<string, any[]>();

    for (const task of allTasks) {
      if (!task.studentId) continue; // 跳过没有studentId的记录

      const key = `${task.studentId}_${task.title}_${task.type}`;
      if (!taskGroups.has(key)) {
        taskGroups.set(key, []);
      }
      taskGroups.get(key)!.push(task);
    }

    // 找出重复的组
    const duplicateGroups = Array.from(taskGroups.entries())
      .filter(([key, tasks]) => tasks.length > 1)
      .slice(0, 50) // 限制处理50组
      .map(([key, tasks]) => ({
        studentId: tasks[0].studentId,
        title: tasks[0].title,
        type: tasks[0].type,
        taskDate: tasks[0].createdAt,
        count: tasks.length,
        latestCreated: tasks[0].createdAt,
        ids: tasks.map(t => t.id)
      }));

    console.log(`🔍 [QUICK_CLEAN] 发现 ${duplicateGroups.length} 组重复任务`);

    if (duplicateGroups.length === 0) {
      console.log('✅ [QUICK_CLEAN] 未发现重复任务记录');
      return;
    }

    // 🗑️ 第四步：删除重复记录，保留最新的
    let deletedCount = 0;
    console.log('🗑️ [QUICK_CLEAN] 开始删除重复记录...');

    for (const group of duplicateGroups) {
      const ids = group.ids as string[];
      // 保留最新的第一个，删除其他的
      const idsToDelete = ids.slice(1);

      for (const id of idsToDelete) {
        try {
          await prisma.taskRecord.delete({
            where: { id }
          });
          deletedCount++;
        } catch (error) {
          console.error(`❌ [QUICK_CLEAN] 删除记录 ${id} 失败:`, error);
        }
      }
    }

    // ✅ 第五步：验证清理结果
    const remainingTotal = await prisma.taskRecord.count();
    const remainingToday = await prisma.taskRecord.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    console.log('📈 [QUICK_CLEAN] 清洗完成统计:');
    console.log(`   - 清理前总记录: ${totalTasks}`);
    console.log(`   - 清理后总记录: ${remainingTotal}`);
    console.log(`   - 删除记录数: ${totalTasks - remainingTotal}`);
    console.log(`   - 今日记录: ${todayTasks} → ${remainingToday}`);
    console.log(`   - 清理成功率: ${deletedCount > 0 ? '成功' : '无变化'}`);

  } catch (error) {
    console.error('❌ [QUICK_CLEAN] 清洗过程出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行清洗
if (require.main === module) {
  quickCleanTasks().catch(console.error);
}