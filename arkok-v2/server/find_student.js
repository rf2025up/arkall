const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schools = await prisma.schools.findMany({
    where: { name: { contains: '星途与伴' } }
  });
  console.log('Schools found:', JSON.stringify(schools, null, 2));

  if (schools.length > 0) {
    const schoolId = schools[0].id;
    const students = await prisma.students.findMany({
      where: { 
        schoolId: schoolId,
        name: '宁可歆'
      }
    });
    console.log('Students found (including inactive):', JSON.stringify(students, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
