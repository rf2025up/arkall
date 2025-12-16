const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTeacherIdData() {
  try {
    console.log('🔍 检查数据库中的 teacherId 分布...');

    const all = await prisma.student.findMany();
    const withTeacherId = all.filter(s => s.teacherId !== null);
    const withoutTeacherId = all.filter(s => s.teacherId === null);

    console.log('📊 数据检查结果:');
    console.log(`   总学生数: ${all.length}`);
    console.log(`   有teacherId: ${withTeacherId.length}`);
    console.log(`   无teacherId: ${withoutTeacherId.length}`);

    if (withTeacherId.length > 0) {
      console.log('❌ 有teacherId的学生:');
      withTeacherId.forEach(s => {
        console.log(`     - ${s.name} (${s.className}): teacherId = ${s.teacherId}`);
      });
    }

    if (withoutTeacherId.length > 0) {
      console.log('✅ 无teacherId的学生 (可抢入):');
      withoutTeacherId.slice(0, 5).forEach(s => {
        console.log(`     - ${s.name} (${s.className})`);
      });
      if (withoutTeacherId.length > 5) {
        console.log(`     ... 还有 ${withoutTeacherId.length - 5} 个学生`);
      }
    }

    // 检查龙老师的ID是否存在于老师表中
    const dragonTeacher = await prisma.teacher.findFirst({
      where: { name: '龙老师' }
    });

    if (dragonTeacher) {
      console.log('✅ 龙老师信息:');
      console.log(`   - ID: ${dragonTeacher.id}`);
      console.log(`   - 用户名: ${dragonTeacher.username}`);
      console.log(`   - 角色: ${dragonTeacher.role}`);

      const dragonStudents = all.filter(s => s.teacherId === dragonTeacher.id);
      console.log(`   - 归属学生数: ${dragonStudents.length}`);
    } else {
      console.log('❌ 未找到龙老师记录');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherIdData();