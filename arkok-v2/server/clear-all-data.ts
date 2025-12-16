import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🧹 清空所有数据脚本 - 安全测试用
 * 删除所有任务记录，但保留学校、学生、教师基本数据
 */
async function clearAllTaskRecords() {
  console.log('🧹 [CLEAR_ALL] 开始清空所有任务记录...');
  console.log('⚠️  [CLEAR_ALL] 这将删除所有任务记录，但保留学生和教师信息');

  try {
    // ⚠️ 危险操作确认
    console.log('\n🚨 [SAFETY_CHECK] 执行安全检查...');

    // 第一步：检查数据统计
    const totalTasks = await prisma.taskRecord.count();
    const totalStudents = await prisma.student.count({ where: { isActive: true } });
    const totalTeachers = await prisma.teacher.count();

    console.log(`📊 [SAFETY_CHECK] 当前数据统计:`);
    console.log(`   - 任务记录数: ${totalTasks}`);
    console.log(`   - 活跃学生数: ${totalStudents}`);
    console.log(`   - 教师数: ${totalTeachers}`);

    if (totalTasks === 0) {
      console.log('✅ [CLEAR_ALL] 没有任务记录需要删除');
      return;
    }

    // 第二步：删除所有任务记录（会级联删除相关的LessonPlan和TaskRecord）
    console.log('\n🗑️ [CLEAR_ALL] 开始删除任务记录...');

    // 删除所有TaskRecord
    const deletedTaskRecords = await prisma.taskRecord.deleteMany({});
    console.log(`✅ [CLEAR_ALL] 删除了 ${deletedTaskRecords.count} 条任务记录`);

    // 删除所有LessonPlan（可选，但建议删除，因为它们引用了任务记录）
    const deletedLessonPlans = await prisma.lessonPlan.deleteMany({});
    console.log(`✅ [CLEAR_ALL] 删除了 ${deletedLessonPlans.count} 条教学计划`);

    // 第三步：验证删除结果
    const remainingTasks = await prisma.taskRecord.count();
    const remainingStudents = await prisma.student.count({ where: { isActive: true } });
    const remainingTeachers = await prisma.teacher.count();

    console.log('\n📈 [CLEAR_ALL] 清空后数据统计:');
    console.log(`   - 剩余任务记录: ${remainingTasks}`);
    console.log(`   - 保留学生数: ${remainingStudents}`);
    console.log(`   - 保留教师数: ${remainingTeachers}`);

    if (remainingTasks === 0) {
      console.log('✅ [CLEAR_ALL] 所有任务记录已成功清空！');
    } else {
      console.log(`⚠️ [CLEAR_ALL] 仍有 ${remainingTasks} 条任务记录未删除`);
    }

    // 第四步：检查学生数据（确保学生和教师信息完整）
    const studentSample = await prisma.student.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        className: true,
        teacherId: true,
        isActive: true
      }
    });

    console.log('\n👥 [CLEAR_ALL] 学生数据样本:');
    studentSample.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} (${student.className}) - 归属老师: ${student.teacherId}`);
    });

    // 第五步：检查教师数据
    const teacherSample = await prisma.teacher.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        username: true,
        primaryClassName: true,
        role: true
      }
    });

    console.log('\n👨‍🏫 [CLEAR_ALL] 教师数据样本:');
    teacherSample.forEach((teacher, index) => {
      console.log(`   ${index + 1}. ${teacher.name} (${teacher.username}) - 主班级: ${teacher.primaryClassName}`);
    });

  } catch (error) {
    console.error('❌ [CLEAR_ALL] 清空数据时发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 🧹 额外安全检查：确认数据库连接和权限
 */
async function safetyCheck() {
  try {
    console.log('🔍 [SAFETY_CHECK] 执行数据库连接测试...');

    await prisma.$connect();
    console.log('✅ [SAFETY_CHECK] 数据库连接正常');

    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ [SAFETY_CHECK] 数据库权限正常');

    await prisma.$disconnect();
    console.log('✅ [SAFETY_CHECK] 安全检查通过');

    return true;
  } catch (error) {
    console.error('❌ [SAFETY_CHECK] 安全检查失败:', error);
    return false;
  }
}

// 主执行函数
async function main() {
  console.log('🚀 [START] 开始执行ArkOK V2数据清空操作');
  console.log('⏰ 开始时间:', new Date().toISOString());
  console.log('=' .repeat(60));

  try {
    // 执行安全检查
    const safetyPassed = await safetyCheck();
    if (!safetyPassed) {
      throw new Error('安全检查失败，停止执行');
    }

    // 执行清空操作
    await clearAllTaskRecords();

    console.log('');
    console.log('✅ [SUCCESS] 数据清空操作完成！');
    console.log('🎯 现在可以测试龙老师发布功能，验证是否会错误地发到全校');

  } catch (error) {
    console.error('❌ [ERROR] 数据清空操作失败:', error);
    process.exit(1);
  }
}

// 执行清空
if (require.main === module) {
  main().catch(console.error);
}