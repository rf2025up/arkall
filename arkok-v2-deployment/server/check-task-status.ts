import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTaskStatus() {
  console.log('🔍 [TASK_STATUS] 检查当前任务状态...');

  try {
    // 检查总任务记录数
    const totalTasks = await prisma.taskRecord.count();
    console.log(`📊 [TASK_STATUS] 总任务记录数: ${totalTasks}`);

    // 检查今日任务记录
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
    console.log(`📊 [TASK_STATUS] 今日任务记录数: ${todayTasks}`);

    // 检查有studentId的任务记录
    const tasksWithStudentId = await prisma.taskRecord.count({
      where: {
        studentId: {
          not: ''
        }
      }
    });
    console.log(`📊 [TASK_STATUS] 有studentId的任务记录数: ${tasksWithStudentId}`);

    // 检查没有studentId或studentId为空的任务记录
    const tasksWithoutStudentId = totalTasks - tasksWithStudentId;
    console.log(`📊 [TASK_STATUS] 没有studentId的任务记录数: ${tasksWithoutStudentId}`);

    // 统计各种状态的任务
    const taskStats = await prisma.taskRecord.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      _count: {
        status: true
      }
    });

    console.log('📊 [TASK_STATUS] 今日任务状态分布:');
    taskStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat._count.status} 条`);
    });

    // 检查最近创建的任务（用于验证防重逻辑）
    const recentTasks = await prisma.taskRecord.findMany({
      where: {
        createdAt: {
          gte: startOfToday
        },
        studentId: {
          not: ''
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
      },
      take: 10
    });

    console.log('📊 [TASK_STATUS] 最近10个任务记录:');
    recentTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (${task.type}) - 学生ID: ${task.studentId}`);
    });

    // 统计每个学生的今日任务数量（检查是否还有重复）
    const studentTaskCounts = new Map<string, number>();

    for (const task of recentTasks) {
      const key = `${task.studentId}_${task.title}_${task.type}`;
      studentTaskCounts.set(key, (studentTaskCounts.get(key) || 0) + 1);
    }

    const duplicates = Array.from(studentTaskCounts.entries())
      .filter(([key, count]) => count > 1);

    console.log(`📊 [TASK_STATUS] 今日重复任务组数: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('⚠️ [TASK_STATUS] 仍然存在重复任务:');
      duplicates.forEach(([key, count]) => {
        console.log(`   - ${key}: ${count} 个重复`);
      });
    } else {
      console.log('✅ [TASK_STATUS] 今日无重复任务记录！');
    }

  } catch (error) {
    console.error('❌ [TASK_STATUS] 检查任务状态失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行检查
if (require.main === module) {
  checkTaskStatus().catch(console.error);
}