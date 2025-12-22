const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTeacherIdDistribution() {
  try {
    console.log('🔍 Checking teacherId distribution in students table...');

    // 检查龙老师的teacherId
    const teacherInfo = await prisma.teacher.findFirst({
      where: { username: 'long' },
      select: { id: true, name: true, username: true }
    });

    console.log('👤 Teacher info (long):', teacherInfo);

    // 检查所有学生的teacherId分布
    const distribution = await prisma.student.groupBy({
      by: ['teacherId'],
      where: {
        schoolId: '625e503b-aa7e-44fe-9982-237d828af717',
        isActive: true
      },
      _count: {
        id: true
      }
    });

    console.log('📊 TeacherId distribution:');
    distribution.forEach(item => {
      const teacherId = item.teacherId || 'NULL';
      const count = item._count.id;
      const teacherName = teacherId && teacherId === teacherInfo?.id ? teacherInfo.name : teacherId;
      console.log(`  - ${teacherId} (${teacherName}): ${count} students`);
    });

    // 查看前5个龙老师班的学生详情
    const longTeacherStudents = await prisma.student.findMany({
      where: {
        schoolId: '625e503b-aa7e-44fe-9982-237d828af717',
        teacherId: teacherInfo?.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        className: true,
        teacherId: true
      },
      take: 5
    });

    console.log('\n👨 Long teacher students sample:');
    longTeacherStudents.forEach(student => {
      console.log(`  - ${student.name} (${student.className}) -> teacherId: ${student.teacherId}`);
    });

    // 查看几个没有teacherId的学生
    const nullTeacherStudents = await prisma.student.findMany({
      where: {
        schoolId: '625e503b-aa7e-44fe-9982-237d828af717',
        teacherId: null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        className: true
      },
      take: 5
    });

    console.log('\n❌ Students with no teacherId:');
    nullTeacherStudents.forEach(student => {
      console.log(`  - ${student.name} (${student.className})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherIdDistribution();