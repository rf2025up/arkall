import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 检查数据库中的任务记录...');
  
  // 1. 检查学校信息
  const schools = await prisma.school.findMany();
  console.log(`📋 学校数量: ${schools.length}`);
  schools.forEach(school => {
    console.log(`  - ${school.name} (ID: ${school.id})`);
  });
  
  // 2. 检查学生信息
  const students = await prisma.student.findMany({
    include: {
      school: true
    }
  });
  console.log(`\n👨🎓 学生数量: ${students.length}`);
  students.forEach(student => {
    console.log(`  - ${student.name} (ID: ${student.id}, School: ${student.school.name})`);
  });
  
  // 3. 检查任务记录
  const taskRecords = await prisma.taskRecord.findMany({
    include: {
      student: {
        include: {
          school: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });
  console.log(`\n📝 任务记录数量: ${taskRecords.length}`);
  taskRecords.forEach(record => {
    console.log(`  - ${record.student.name} | ${record.title} | ${record.status} | ${record.type} | School: ${record.student.school.name} | RecordID: ${record.id}`);
  });
  
  // 4. 检查今天的任务记录
  const today = new Date();
  const todayRecords = await prisma.taskRecord.findMany({
    where: {
      createdAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    }
  });
  console.log(`\n📅 今天的任务记录数量: ${todayRecords.length}`);
  todayRecords.forEach(record => {
    console.log(`  - StudentID: ${record.studentId} | ${record.title} | ${record.status} | RecordID: ${record.id}`);
  });
}

main()
  .catch(e => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
