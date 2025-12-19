import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNewTasks() {
  console.log('🔍 [NEW_TASKS] 检查新创建的任务记录...');

  try {
    // 检查总任务记录数
    const totalTasks = await prisma.taskRecord.count();
    console.log(`📊 [NEW_TASKS] 总任务记录数: ${totalTasks}`);

    if (totalTasks === 0) {
      console.log('✅ [NEW_TASKS] 没有任务记录');
      return;
    }

    // 检查最近创建的任务
    const recentTasks = await prisma.taskRecord.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // 最近10分钟
        }
      },
      select: {
        id: true,
        studentId: true,
        schoolId: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
        lessonPlanId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log(`📊 [NEW_TASKS] 最近10分钟的任务记录 (${recentTasks.length} 条):`);

    // 按学生分组统计
    const studentTaskCounts = new Map<string, number>();
    const taskTitleCount = new Map<string, number>();

    for (const task of recentTasks) {
      // 按学生统计
      studentTaskCounts.set(task.studentId, (studentTaskCounts.get(task.studentId) || 0) + 1);
      // 按任务标题统计
      taskTitleCount.set(task.title, (taskTitleCount.get(task.title) || 0) + 1);
    }

    console.log('📊 [NEW_TASKS] 按学生分布:');
    studentTaskCounts.forEach((count, studentId) => {
      console.log(`   - 学生 ${studentId}: ${count} 个任务`);
    });

    console.log('📊 [NEW_TASKS] 按任务标题分布:');
    taskTitleCount.forEach((count, title) => {
      console.log(`   - ${title}: ${count} 个任务`);
    });

    // 检查是否有重复（同学生同任务）
    const duplicates = new Map<string, number>();
    for (const task of recentTasks) {
      const key = `${task.studentId}_${task.title}_${task.type}`;
      duplicates.set(key, (duplicates.get(key) || 0) + 1);
    }

    const duplicateEntries = Array.from(duplicates.entries()).filter(([key, count]) => count > 1);
    console.log(`📊 [NEW_TASKS] 重复任务组数: ${duplicateEntries.length}`);

    if (duplicateEntries.length > 0) {
      console.log('⚠️ [NEW_TASKS] 发现重复任务:');
      duplicateEntries.forEach(([key, count]) => {
        console.log(`   - ${key}: ${count} 个重复`);
      });
    }

    // 检查是否有lessonPlanId关联
    const tasksWithLessonPlan = recentTasks.filter(task => task.lessonPlanId);
    console.log(`📊 [NEW_TASKS] 有lessonPlan关联的任务: ${tasksWithLessonPlan.length}`);

    // 详细显示每个任务
    console.log('📋 [NEW_TASKS] 任务详情:');
    recentTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (${task.type})`);
      console.log(`      - 学生ID: ${task.studentId}`);
      console.log(`      - 学校ID: ${task.schoolId}`);
      console.log(`      - 状态: ${task.status}`);
      console.log(`      - 创建时间: ${task.createdAt.toISOString()}`);
      console.log(`      - 教学计划: ${task.lessonPlanId || '无'}`);
      console.log('');
    });

    return {
      totalTasks,
      recentTasksCount: recentTasks.length,
      duplicateCount: duplicateEntries.length,
      tasksWithLessonPlan: tasksWithLessonPlan.length
    };

  } catch (error) {
    console.error('❌ [NEW_TASKS] 检查失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkNewTasks().catch(console.error);
}