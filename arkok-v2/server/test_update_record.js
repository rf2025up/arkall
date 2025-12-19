const { PrismaClient } = require('@prisma/client');
const { LMSService } = require('./dist/src/services/lms.service.js');

const prisma = new PrismaClient();
const lmsService = new LMSService(prisma);

async function main() {
  try {
    const recordId = '1e5b1a92-245e-473f-95dc-7c55657c512b';
    const status = 'COMPLETED';
    const userId = '5ca64703-c978-4d01-bf44-a7568f34f556'; // 从token中获取的用户ID
    const schoolId = '625e503b-aa7e-44fe-9982-237d828af717'; // 从token中获取的学校ID

    console.log(`🧪 测试 updateRecordStatus 方法:`);
    console.log(`   - recordId: ${recordId}`);
    console.log(`   - status: ${status}`);
    console.log(`   - userId: ${userId}`);
    console.log(`   - schoolId: ${schoolId}`);

    try {
      const result = await lmsService.updateRecordStatus(recordId, status, userId, schoolId);
      console.log(`✅ 更新成功:`);
      console.log(`   - ID: ${result.id}`);
      console.log(`   - 状态: ${result.status}`);
      console.log(`   - 提交时间: ${result.submittedAt}`);
    } catch (error) {
      console.log(`❌ 更新失败:`);
      console.error(error);
      console.log(`错误详情: ${error.message}`);
    }

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();