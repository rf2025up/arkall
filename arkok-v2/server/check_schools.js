const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const schools = await prisma.schools.findMany({ select: { id: true, name: true } });
    console.log(JSON.stringify(schools, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
