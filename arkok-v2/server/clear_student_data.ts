import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOL_ID = '625e503b-aa7e-44fe-9982-237d828af717';

async function main() {
  console.log('🔍 开始检查和清理学生数据...');

  try {
    // 1. 检查当前数据状态
    console.log('\n📊 当前数据状态:');

    // 检查学生数据
    const students = await prisma.student.count({
      where: { schoolId: SCHOOL_ID }
    });
    console.log(`学生总数: ${students}`);

    // 检查任务记录
    const taskRecords = await prisma.taskRecord.count({
      where: { schoolId: SCHOOL_ID }
    });
    console.log(`任务记录总数: ${taskRecords}`);

    // 检查教学计划
    const lessonPlans = await prisma.lessonPlan.count({
      where: { schoolId: SCHOOL_ID }
    });
    console.log(`教学计划总数: ${lessonPlans}`);

    // 2. 确认删除操作
    console.log('\n⚠️  准备删除以下数据:');
    console.log('- 所有任务记录 (TaskRecord)');
    console.log('- 所有教学计划 (LessonPlan)');
    console.log('- 将保留学生基本信息，但清除归属关系');

    // 3. 执行删除操作
    console.log('\n🗑️  开始删除数据...');

    // 删除所有任务记录
    const deletedTaskRecords = await prisma.taskRecord.deleteMany({
      where: { schoolId: SCHOOL_ID }
    });
    console.log(`✅ 删除任务记录: ${deletedTaskRecords.count} 条`);

    // 删除所有教学计划
    const deletedLessonPlans = await prisma.lessonPlan.deleteMany({
      where: { schoolId: SCHOOL_ID }
    });
    console.log(`✅ 删除教学计划: ${deletedLessonPlans.count} 条`);

    // 清除学生的teacherId归属（保留学生基本信息）
    const updatedStudents = await prisma.student.updateMany({
      where: {
        schoolId: SCHOOL_ID,
        teacherId: { not: null }
      },
      data: {
        teacherId: null,
        className: null,
        updatedAt: new Date()
      }
    });
    console.log(`✅ 清除学生归属关系: ${updatedStudents.count} 名学生`);

    // 4. 验证删除结果
    console.log('\n🔍 验证删除结果:');

    const remainingTaskRecords = await prisma.taskRecord.count({
      where: { schoolId: SCHOOL_ID }
    });
    const remainingLessonPlans = await prisma.lessonPlan.count({
      where: { schoolId: SCHOOL_ID }
    });
    const studentsWithoutTeacher = await prisma.student.count({
      where: {
        schoolId: SCHOOL_ID,
        teacherId: null
      }
    });

    console.log(`剩余任务记录: ${remainingTaskRecords} 条`);
    console.log(`剩余教学计划: ${remainingLessonPlans} 条`);
    console.log(`无归属学生: ${studentsWithoutTeacher} 名`);

    if (remainingTaskRecords === 0 && remainingLessonPlans === 0) {
      console.log('\n🎉 数据清理完成！所有过关数据和任务记录已成功删除。');
    } else {
      console.log('\n❌ 数据清理不完整，仍有数据残留。');
    }

  } catch (error) {
    console.error('❌ 清理数据时发生错误:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n📝 数据库连接已关闭');
  }
}

main().catch(console.error);