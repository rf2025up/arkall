const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteStudent() {
  const student = await prisma.students.findFirst({
    where: { name: '小龙' }
  });
  
  if (!student) {
    console.log('未找到名为"小龙"的学生');
    return;
  }
  
  console.log('找到学生:', student.id, student.name);
  
  await prisma.students.update({
    where: { id: student.id },
    data: { isActive: false }
  });
  
  console.log('已删除学生"小龙"');
  await prisma.$disconnect();
}
deleteStudent();
