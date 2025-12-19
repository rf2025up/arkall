const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTeacherIds() {
  try {
    console.log('🧹 清空所有学生的teacherId...');

    // 清空所有学生的teacherId
    const result = await prisma.student.updateMany({
      where: {
        schoolId: '625e503b-aa7e-44fe-9982-237d828af717',
        isActive: true,
        teacherId: {
          not: null
        }
      },
      data: {
        teacherId: null
      }
    });

    console.log(`✅ 已清空 ${result.count} 个学生的teacherId`);

    // 验证清空结果
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

    console.log('\n📊 清空后teacherId分布:');
    Object.entries(finalDistribution).forEach(([teacherId, count]) => {
      console.log(`  - ${teacherId}: ${count} students`);
    });

    console.log('\n🎯 现在龙老师班级应该显示0个学生，全校视图显示46个学生');
    console.log('🎯 可以在全校视图中使用长按"移入我的班级"功能来测试师生绑定');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTeacherIds();