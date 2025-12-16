const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 创建ADMIN用户...');

    // 检查是否已存在ADMIN用户
    const existingAdmin = await prisma.teacher.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ ADMIN用户已存在:', existingAdmin.username);
      console.log('   - 姓名:', existingAdmin.name);
      console.log('   - 角色:', existingAdmin.role);
      return;
    }

    // 创建新的ADMIN用户
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.teacher.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: '校长',
        displayName: '校长',
        email: 'admin@school.com',
        role: 'ADMIN',
        schoolId: '625e503b-aa7e-44fe-9982-237d828af717', // 默认学校ID
      }
    });

    console.log('✅ 成功创建ADMIN用户:');
    console.log('   - 用户名: admin');
    console.log('   - 密码: admin123');
    console.log('   - 姓名: 校长');
    console.log('   - 角色: ADMIN');
    console.log('   - 邮箱: admin@school.com');

  } catch (error) {
    console.error('❌ 创建ADMIN用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();