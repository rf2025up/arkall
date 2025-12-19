
const { PrismaClient } = require('./server/node_modules/.prisma/client');
const prisma = new PrismaClient();
async function checkLessonPlanSchema() {
  try {
    const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'lesson_plans'`;
    console.log('lesson_plans表字段:', columns);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
checkLessonPlanSchema();

