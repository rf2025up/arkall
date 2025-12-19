const { PrismaClient } = require('./arkok-v2/server/node_modules/.prisma/client');
const prisma = new PrismaClient();

async function checkLessonPlansSchema() {
  try {
    // 查看lesson_plans表的结构
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'lesson_plans'
      ORDER BY ordinal_position
    `;

    console.log('lesson_plans表结构:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable}) - 默认值: ${col.column_default}`);
    });

    // 查看是否有schoolId字段
    const hasSchoolId = result.some(col => col.column_name === 'schoolId' || col.column_name === 'schoolid');
    console.log(`\n🔍 是否包含schoolId字段: ${hasSchoolId ? '是' : '否'}`);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLessonPlansSchema();