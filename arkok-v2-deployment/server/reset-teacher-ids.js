const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAllTeacherIds() {
  try {
    console.log('🔄 开始重置所有学生的 teacherId...');

    // 将所有学生的 teacherId 重置为 null
    const result = await prisma.student.updateMany({
      where: {
        teacherId: {
          not: null
        }
      },
      data: {
        teacherId: null
      }
    });

    console.log(`✅ 成功重置 ${result.count} 个学生的 teacherId 为 null`);
    console.log('📊 现在所有学生都属于"未归属"状态，老师需要从全校名单中移入学生');

    // 验证结果
    const totalStudents = await prisma.student.count();
    const unassignedStudents = await prisma.student.count({
      where: { teacherId: null }
    });

    console.log(`📈 统计信息:`);
    console.log(`   - 总学生数: ${totalStudents}`);
    console.log(`   - 未归属学生数: ${unassignedStudents}`);
    console.log(`   - 已归属学生数: ${totalStudents - unassignedStudents}`);

  } catch (error) {
    console.error('❌ 重置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllTeacherIds();