const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEnums() {
  try {
    console.log('开始更新数据库枚举...');

    // 更新 TaskCategory 枚举
    await prisma.$executeRawUnsafe(`ALTER TYPE "TaskCategory" ADD VALUE IF NOT EXISTS 'SPECIAL'`);
    console.log('✓ TaskCategory: 添加 SPECIAL');

    await prisma.$executeRawUnsafe(`ALTER TYPE "TaskCategory" ADD VALUE IF NOT EXISTS 'CHALLENGE'`);
    console.log('✓ TaskCategory: 添加 CHALLENGE');

    await prisma.$executeRawUnsafe(`ALTER TYPE "TaskCategory" ADD VALUE IF NOT EXISTS 'PK'`);
    console.log('✓ TaskCategory: 添加 PK');

    await prisma.$executeRawUnsafe(`ALTER TYPE "TaskCategory" ADD VALUE IF NOT EXISTS 'HABIT'`);
    console.log('✓ TaskCategory: 添加 HABIT');

    // 更新 TaskType 枚举
    await prisma.$executeRawUnsafe(`ALTER TYPE "TaskType" ADD VALUE IF NOT EXISTS 'BADGE'`);
    console.log('✓ TaskType: 添加 BADGE');

    await prisma.$executeRawUnsafe(`ALTER TYPE "TaskType" ADD VALUE IF NOT EXISTS 'PK'`);
    console.log('✓ TaskType: 添加 PK');

    await prisma.$executeRawUnsafe(`ALTER TYPE "TaskType" ADD VALUE IF NOT EXISTS 'PK_RESULT'`);
    console.log('✓ TaskType: 添加 PK_RESULT');

    await prisma.$executeRawUnsafe(`ALTER TYPE "TaskType" ADD VALUE IF NOT EXISTS 'HABIT'`);
    console.log('✓ TaskType: 添加 HABIT');

    console.log('\n✅ 数据库枚举更新成功！');
  } catch (error) {
    console.error('更新失败:', error.message);
    // 如果是"already exists"错误，可以忽略
    if (error.message.includes('already exists')) {
      console.log('⚠️  枚举值已存在，跳过');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixEnums();
