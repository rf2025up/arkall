
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.student_skills.count();
    const withLevel = await prisma.student_skills.count({ where: { level: { gt: 0 } } });

    console.log(`Total skills: ${total}`);
    console.log(`Skills with level > 0: ${withLevel}`);

    if (withLevel > 0) {
        const sample = await prisma.student_skills.findFirst({
            where: { level: { gt: 0 } },
            include: { students: { select: { name: true, schoolId: true } } }
        });
        console.log('Sample:', JSON.stringify(sample, null, 2));

        // Check if query with nested filter works
        if (sample && sample.students) {
            const schoolIdCount = await prisma.student_skills.count({
                where: {
                    level: { gt: 0 },
                    students: { schoolId: sample.students.schoolId }
                }
            });
            console.log(`Count with schoolId filter (${sample.students.schoolId}): ${schoolIdCount}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
