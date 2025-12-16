const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function smartAssignTeachers() {
  try {
    console.log('🧠 开始智能分配师生关系...');

    // 1. 获取所有教师
    const teachers = await prisma.teacher.findMany({
      select: { id: true, username: true, name: true, displayName: true }
    });
    console.log('👨‍🏫 教师列表:', teachers);

    // 2. 获取所有学生，查看className分布
    const students = await prisma.student.findMany({
      select: { id: true, name: true, className: true, teacherId: true }
    });

    // 3. 按className分组统计
    const classGroups = students.reduce((acc, student) => {
      const className = student.className || '未分班';
      if (!acc[className]) {
        acc[className] = [];
      }
      acc[className].push(student);
      return acc;
    }, {});

    console.log('📊 班级分布:');
    Object.entries(classGroups).forEach(([className, classStudents]) => {
      console.log(`  - ${className}: ${classStudents.length}个学生`);
    });

    // 4. 智能分配策略
    let updateCount = 0;

    for (const [className, classStudents] of Object.entries(classGroups)) {
      // 如果班级名包含老师姓名，分配给对应老师
      let targetTeacher = teachers.find(teacher =>
        className.includes(teacher.name) ||
        className.includes(teacher.displayName || '')
      );

      // 如果没找到匹配的老师，使用默认策略
      if (!targetTeacher) {
        if (className.includes('龙老师')) {
          targetTeacher = teachers.find(t => t.username === 'long');
        } else if (className.includes('测试')) {
          targetTeacher = teachers.find(t => t.username === 'testteacher');
        } else {
          // 默认分配给龙老师
          targetTeacher = teachers.find(t => t.username === 'long');
        }
      }

      if (targetTeacher) {
        console.log(`🎯 班级 ${className} -> 分配给 ${targetTeacher.name} (${targetTeacher.username})`);

        // 更新这个班级的所有学生
        const updateResult = await prisma.student.updateMany({
          where: {
            className: className,
            teacherId: { not: targetTeacher.id } // 只更新未分配给该老师的
          },
          data: { teacherId: targetTeacher.id }
        });

        updateCount += updateResult.count;
        if (updateResult.count > 0) {
          console.log(`  ✅ 更新了 ${updateResult.count} 个学生`);
        }
      } else {
        console.log(`⚠️ 班级 ${className} -> 未找到合适的老师`);
      }
    }

    console.log(`🎉 智能分配完成！总共更新了 ${updateCount} 个学生`);

    // 5. 最终验证
    const finalStudents = await prisma.student.findMany({
      select: { id: true, teacherId: true },
      include: {
        teacher: {
          select: { name: true, username: true }
        }
      }
    });

    const teacherDistribution = finalStudents.reduce((acc, student) => {
      const teacherName = student.teacher?.name || '未知老师';
      acc[teacherName] = (acc[teacherName] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 最终师生分布:');
    Object.entries(teacherDistribution).forEach(([teacherName, count]) => {
      console.log(`  - ${teacherName}: ${count} 个学生`);
    });

  } catch (error) {
    console.error('❌ 智能分配失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

smartAssignTeachers();