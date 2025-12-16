const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignTeacherIds() {
  try {
    console.log('🔧 开始为学生分配teacherId...');

    // 获取所有老师信息
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        primaryClassName: true
      }
    });

    console.log('👥 找到老师列表:', teachers);

    // 获取所有学生
    const students = await prisma.student.findMany({
      where: {
        schoolId: '625e503b-aa7e-44fe-9982-237d828af717',
        isActive: true,
        teacherId: null  // 只处理还没有teacherId的学生
      },
      select: {
        id: true,
        name: true,
        className: true
      }
    });

    console.log(`👨‍🎓 找到 ${students.length} 个需要分配teacherId的学生`);

    let assignedCount = 0;
    let skippedCount = 0;

    // 为每个学生根据className分配teacherId
    for (const student of students) {
      let targetTeacherId = null;

      // 根据className匹配老师
      if (student.className) {
        if (student.className.includes('龙老师')) {
          const longTeacher = teachers.find(t => t.username === 'long');
          targetTeacherId = longTeacher?.id;
        } else if (student.className.includes('姜老师')) {
          const jiangTeacher = teachers.find(t => t.name.includes('姜'));
          targetTeacherId = jiangTeacher?.id;
        } else if (student.className.includes('张老师')) {
          const zhangTeacher = teachers.find(t => t.name.includes('张'));
          targetTeacherId = zhangTeacher?.id;
        } else if (student.className.includes('李老师')) {
          const liTeacher = teachers.find(t => t.name.includes('李'));
          targetTeacherId = liTeacher?.id;
        } else if (student.className.includes('王老师')) {
          const wangTeacher = teachers.find(t => t.name.includes('王'));
          targetTeacherId = wangTeacher?.id;
        }
        // 可以添加更多老师的匹配规则
      }

      if (targetTeacherId) {
        // 更新学生的teacherId
        await prisma.student.update({
          where: { id: student.id },
          data: { teacherId: targetTeacherId }
        });

        console.log(`✅ ${student.name} (${student.className}) -> 已分配teacherId`);
        assignedCount++;
      } else {
        console.log(`⚠️  ${student.name} (${student.className}) -> 无法找到对应的老师，跳过`);
        skippedCount++;
      }
    }

    console.log('\n📊 分配结果统计:');
    console.log(`✅ 成功分配: ${assignedCount} 个学生`);
    console.log(`⚠️  跳过: ${skippedCount} 个学生`);

    // 再次检查分配后的分布
    const distributionCheck = await prisma.student.findMany({
      where: {
        schoolId: '625e503b-aa7e-44fe-9982-237d828af717',
        isActive: true
      },
      select: {
        teacherId: true
      }
    });

    const finalDistribution = {};
    distributionCheck.forEach(student => {
      const teacherId = student.teacherId || 'NULL';
      finalDistribution[teacherId] = (finalDistribution[teacherId] || 0) + 1;
    });

    console.log('\n📊 最终teacherId分布:');
    Object.entries(finalDistribution).forEach(([teacherId, count]) => {
      const teacher = teachers.find(t => t.id === teacherId);
      const teacherName = teacher ? teacher.name : teacherId;
      console.log(`  - ${teacherId} (${teacherName}): ${count} students`);
    });

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignTeacherIds();