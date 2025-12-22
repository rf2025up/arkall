
const { PrismaClient } = require('./server/node_modules/.prisma/client');
const jwt = require('./server/node_modules/jsonwebtoken');

const prisma = new PrismaClient();

async function createTeacherToken() {
  try {
    // 查找有学生的老师
    const teacherWithStudents = await prisma.teachers.findFirst({
      where: {
        students: {
          some: {
            teacherId: { not: null }
          }
        }
      }
    });
    
    if (!teacherWithStudents) {
      console.log('❌ 没有找到绑定了学生的老师');
      return;
    }

    console.log('✅ 找到有学生的老师:', teacherWithStudents.name, 'ID:', teacherWithStudents.id);

    // 统计该老师的学生数量
    const studentCount = await prisma.students.count({
      where: { teacherId: teacherWithStudents.id }
    });
    console.log('👥 该老师有', studentCount, '个学生');

    // 创建JWT token
    const token = jwt.sign(
      {
        userId: teacherWithStudents.id,
        username: teacherWithStudents.username,
        name: teacherWithStudents.name,
        role: teacherWithStudents.role,
        schoolId: teacherWithStudents.schoolId
      },
      'arkok-v2-super-secret-jwt-key-2024',
      { expiresIn: '7d' }
    );

    console.log('🎫 老师Token:', token);
    
    // 将token写入文件
    require('fs').writeFileSync('/tmp/teacher-token.txt', token);
    console.log('✅ Token已保存到 /tmp/teacher-token.txt');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTeacherToken();

