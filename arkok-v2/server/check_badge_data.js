const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const schoolId = '625e503b-aa7e-44fe-9982-237d828af717'; // From the logs earlier

        const totalAwardedCount = await prisma.student_badges.count({
            where: {
                badges: {
                    schoolId: schoolId
                }
            }
        });
        console.log('Total Awarded in DB for school:', totalAwardedCount);

        const badges = await prisma.badges.findMany({
            where: { schoolId },
            include: {
                _count: {
                    select: { student_badges: true }
                }
            }
        });

        console.log('Badges and their counts:');
        badges.forEach(b => {
            console.log(`- ${b.name}: ${b._count.student_badges}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
