const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const students = await prisma.students.findMany({
            where: { isActive: true },
            select: { id: true, name: true, teacherId: true, className: true }
        });

        console.log('--- Student TeacherId Distribution ---');
        console.log('Total Active Students:', students.length);

        const stats = students.reduce((acc, s) => {
            const tid = s.teacherId || 'NULL';
            acc[tid] = (acc[tid] || 0) + 1;
            return acc;
        }, {});

        console.log(JSON.stringify(stats, null, 2));

        const users = await prisma.teachers.findMany({
            select: { id: true, username: true, role: true, name: true }
        });
        console.log('--- Users (Teachers) ---');
        console.log(JSON.stringify(users, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
