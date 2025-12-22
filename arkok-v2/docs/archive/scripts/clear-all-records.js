
const { PrismaClient } = require('./server/node_modules/.prisma/client');
const prisma = new PrismaClient();

async function clearAllRecords() {
  console.log('🧹 [CLEANUP] 正在清空所有过关记录 (task_records)...');
  try {
    const deleteResult = await prisma.task_records.deleteMany({});
    console.log(`✅ [SUCCESS] 已成功删除 ${deleteResult.count} 条记录。`);
  } catch (error) {
    console.error('❌ [ERROR] 清理失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllRecords();
