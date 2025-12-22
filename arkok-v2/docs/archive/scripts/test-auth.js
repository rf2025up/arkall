const { PrismaClient } = require('./server/node_modules/.prisma/client');
const jwt = require('./server/node_modules/jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = 'arkok-v2-super-secret-jwt-key-2024';

async function createTestToken() {
  try {
    // 查找第一个老师用户
    const teacher = await prisma.teachers.findFirst();
    if (!teacher) {
      console.log('❌ 未找到老师用户');
      return;
    }

    console.log('✅ 找到老师用户:', teacher.name, 'ID:', teacher.id);

    // 创建JWT token
    const token = jwt.sign(
      {
        userId: teacher.id,
        username: teacher.username,
        name: teacher.name,
        role: teacher.role,
        schoolId: teacher.schoolId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎫 测试Token:', token);
    console.log('🏫 学校ID:', teacher.schoolId);

    return { token, schoolId: teacher.schoolId, teacherId: teacher.id };
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestToken();