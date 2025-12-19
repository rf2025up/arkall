const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();

async function checkTeacherClasses() {
  try {
    // 查找龙老师
    const dragonTeacher = await prisma.teachers.findFirst({
      where: {
        name: {
          contains: '龙'
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        primaryClassName: true
      }
    });

    if (!dragonTeacher) {
      console.log('❌ 未找到龙老师，查找所有老师...');

      // 查找所有老师
      const allTeachers = await prisma.teachers.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          primaryClassName: true
        }
      });

      console.log('📋 所有老师列表:');
      allTeachers.forEach((teacher, index) => {
        console.log(`  ${index + 1}. ${teacher.name} (${teacher.username}) - ${teacher.primaryClassName || '无班级'}`);
      });
      return;
    }

    console.log('👨‍🏫 找到龙老师:', dragonTeacher);
    console.log('🏫 主要班级:', dragonTeacher.primaryClassName || '未设置');

    // 查看龙老师绑定的学生
    const dragonStudents = await prisma.students.findMany({
      where: {
        teacherId: dragonTeacher.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        className: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`👥 龙老师班学生数量: ${dragonStudents.length}`);
    console.log('📋 学生列表:');
    dragonStudents.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.name} - ${student.className || '无班级'}`);
    });

    // 统计所有老师的班级情况
    const teacherStats = await prisma.$queryRaw`
      SELECT
        t.name as teacherName,
        t.primaryClassName,
        COUNT(s.id) as studentCount
      FROM teachers t
      LEFT JOIN students s ON s.teacherId = t.id AND s.isActive = true
      GROUP BY t.id, t.name, t.primaryClassName
      ORDER BY t.name
    `;

    console.log('\n📊 全部教师班级统计:');
    teacherStats.forEach(stat => {
      console.log(`  🏫 ${stat.teacherName}: ${stat.studentCount}名学生 (主要班级: ${stat.primaryClassName || '未设置'})`);
    });

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherClasses();