const { PrismaClient } = require('@prisma/client');
const { LMSService } = require('./dist/src/services/lms.service.js');

const prisma = new PrismaClient();
const lmsService = new LMSService(prisma);

async function main() {
  try {
    const schoolId = '625e503b-aa7e-44fe-9982-237d828af717';
    const recordIds = [
      '66c3cc89-1e2b-4482-ab9a-5f8ead894a66',
      '44f66793-2810-4a44-8291-07fc33f4042b',
      '472bc130-c87d-46e1-b6e7-f04368b7526b'
    ];
    const status = 'COMPLETED';
    const userId = '5ca64703-c978-4d01-bf44-a7568f34f556';

    console.log(`🧪 测试 updateMultipleRecordStatus 方法:`);
    console.log(`   - schoolId: ${schoolId}`);
    console.log(`   - recordIds: [${recordIds.join(', ')}]`);
    console.log(`   - status: ${status}`);
    console.log(`   - userId: ${userId}`);

    try {
      const result = await lmsService.updateMultipleRecordStatus(schoolId, recordIds, status, userId);
      console.log(`✅ 批量更新成功:`);
      console.log(`   - 成功: ${result.success}`);
      console.log(`   - 失败: ${result.failed}`);
      console.log(`   - 错误: [${result.errors.join(', ')}]`);
    } catch (error) {
      console.log(`❌ 批量更新失败:`);
      console.error(error);
      console.log(`错误详情: ${error.message}`);
      console.log(`错误堆栈: ${error.stack}`);
    }

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();