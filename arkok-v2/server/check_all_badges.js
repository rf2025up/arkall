const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
    try {
        const schools = await prisma.schools.findMany();
        console.log('Total Schools:', schools.length);

        for (const school of schools) {
            const awardedCount = await prisma.student_badges.count({
                where: { badges: { schoolId: school.id } }
            });
            const badgeCount = await prisma.badges.count({
                where: { schoolId: school.id }
            });
            console.log(`School: ${school.name} (${school.id})`);
            console.log(`- Badge count: ${badgeCount}`);
            console.log(`- Total Awarded: ${awardedCount}`);

            if (awardedCount > 0) {
                const badges = await prisma.badges.findMany({
                    where: { schoolId: school.id },
                    include: { _count: { select: { student_badges: true } } }
                });
                badges.forEach(b => {
                    console.log(`  - Badge ${b.name}: ${b._count.student_badges}`);
                });
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAll();
