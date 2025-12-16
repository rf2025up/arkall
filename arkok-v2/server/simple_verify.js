/**
 * 🛡️ 简化版系统逻辑验证
 */

const { PrismaClient } = require('@prisma/client');

async function quickVerification() {
  console.log('🔍 开始简化验证...');

  const prisma = new PrismaClient();

  try {
    // 1. 检查用户角色
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, name: true }
    });

    console.log('👥 用户角色:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.username}): ${user.role}`);
    });

    // 2. 检查学生归属
    const studentsWithTeacher = await prisma.student.count({
      where: { teacherId: { not: null } }
    });

    const studentsWithoutTeacher = await prisma.student.count({
      where: { teacherId: null }
    });

    console.log('\n👨‍🎓 学生归属:');
    console.log(`  - 有teacherId: ${studentsWithTeacher}人`);
    console.log(`  - 无teacherId: ${studentsWithoutTeacher}人`);

    // 3. 验证Admin用户存在
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, username: true }
    });

    if (admin) {
      console.log(`\n👨‍💼 Admin用户: ${admin.name} (${admin.id})`);

      // 4. 模拟转移测试
      const testStudent = await prisma.student.findFirst({
        where: { teacherId: null },
        select: { id: true, name: true, className: true, teacherId: true }
      });

      if (testStudent) {
        console.log(`\n🎯 测试转移: ${testStudent.name}`);
        console.log(`   - 前: teacherId=${testStudent.teacherId}`);

        // 执行转移
        await prisma.student.update({
          where: { id: testStudent.id },
          data: {
            teacherId: admin.id,
            className: admin.name + '班'
          }
        });

        // 验证结果
        const updated = await prisma.student.findUnique({
          where: { id: testStudent.id },
          select: { id: true, name: true, className: true, teacherId: true }
        });

        console.log(`   - 后: teacherId=${updated.teacherId}, className=${updated.className}`);

        if (updated.teacherId === admin.id && updated.className === admin.name + '班') {
          console.log('🎉 转移验证成功！');
        } else {
          console.log('❌ 转移验证失败！');
        }

        // 清理
        await prisma.student.update({
          where: { id: testStudent.id },
          data: { teacherId: null, className: '测试班级' }
        });

      } else {
        console.log('\nℹ️ 没有无归属学生可供测试');
      }

    } else {
      console.log('\n❌ 未找到Admin用户');
    }

    console.log('\n✅ 验证完成');

  } catch (error) {
    console.error('❌ 验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickVerification();