import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCleanStatus() {
  console.log('🔍 [VERIFY] 验证数据清空状态...');

  try {
    // 检查任务记录
    const taskRecords = await prisma.taskRecord.count();
    console.log(`📊 [VERIFY] 任务记录数: ${taskRecords}`);

    // 检查教学计划
    const lessonPlans = await prisma.lessonPlan.count();
    console.log(`📊 [VERIFY] 教学计划数: ${lessonPlans}`);

    // 检查学生数据
    const students = await prisma.student.count({ where: { isActive: true } });
    console.log(`📊 [VERIFY] 活跃学生数: ${students}`);

    // 检查老师和学生分布
    const studentDistribution = await prisma.student.groupBy({
      by: ['teacherId'],
      _count: {
        teacherId: true
      }
    });

    console.log('📊 [VERIFY] 学生分布:');
    studentDistribution.forEach(stat => {
      console.log(`   - 老师 ${stat.teacherId}: ${stat._count.teacherId} 个学生`);
    });

    // 检查龙老师的学生
    const longTeacher = await prisma.teacher.findFirst({
      where: { username: 'long' }
    });

    if (longTeacher) {
      const longStudents = await prisma.student.count({
        where: {
          teacherId: longTeacher.id,
          isActive: true
        }
      });
      console.log(`📊 [VERIFY] 龙老师的学生数: ${longStudents}`);
    }

    // 检查系统管理员的学生
    const adminTeacher = await prisma.teacher.findFirst({
      where: { username: 'admin' }
    });

    if (adminTeacher) {
      const adminStudents = await prisma.student.count({
        where: {
          teacherId: adminTeacher.id,
          isActive: true
        }
      });
      console.log(`📊 [VERIFY] 管理员的学生数: ${adminStudents}`);
    }

    console.log('\n✅ [VERIFY] 数据清空状态验证完成');
    console.log('🎯 可以开始测试龙老师发布功能');

    return {
      taskRecords,
      lessonPlans,
      students,
      isClean: taskRecords === 0
    };

  } catch (error) {
    console.error('❌ [VERIFY] 验证失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifyCleanStatus().catch(console.error);
}