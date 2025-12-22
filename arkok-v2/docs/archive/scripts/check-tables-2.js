const { PrismaClient } = require('/home/devbox/project/arkok-v2/server/node_modules/.prisma/client');
const prisma = new PrismaClient();
async function checkAllTables() {
  try {
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('数据库中的所有表:');
    tables.forEach(t => console.log('  -', t.table_name));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
checkAllTables();