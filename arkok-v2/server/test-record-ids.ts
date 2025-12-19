import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 测试 recordId 是否存在...');
  
  const recordIds = [
    "6d834fed-e9de-4fb5-80fc-37c25838e4c2",
    "3b7ec3ed-a060-4b6b-a221-e2a68499eb8a", 
    "4522ab42-b6de-4e85-b0a3-032dbe86232c"
  ];
  
  for (const recordId of recordIds) {
    const record = await prisma.taskRecord.findUnique({
      where: { id: recordId },
      include: {
        student: {
          include: {
            school: true
          }
        }
      }
    });
    
    if (record) {
      console.log(`✅ RecordID ${recordId} 存在:`);
      console.log(`   - 学生: ${record.student.name}`);
      console.log(`   - 学校: ${record.student.school.name} (ID: ${record.student.schoolId})`);
      console.log(`   - 状态: ${record.status}`);
      console.log(`   - 标题: ${record.title}`);
    } else {
      console.log(`❌ RecordID ${recordId} 不存在`);
    }
    console.log('');
  }
}

main()
  .catch(e => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
