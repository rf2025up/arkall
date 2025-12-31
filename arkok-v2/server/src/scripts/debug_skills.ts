
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Scanning Skills Config ---');
    const skills = await prisma.skills.findMany({
        take: 3
    });
    for (const s of skills) {
        console.log(`Skill: ${s.name} (${s.code})`);
        console.log(`LevelData: ${JSON.stringify(s.levelData)}`);
    }

    console.log('\n--- Scanning Student Skills ---');
    const studentSkills = await prisma.student_skills.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { skill: true, students: { select: { name: true } } }
    });

    for (const ss of studentSkills) {
        console.log(`Student: ${ss.students.name}, Skill: ${ss.skill.name}`);
        console.log(`Exp: ${ss.currentExp}, Level: ${ss.level}, LevelUpAt: ${ss.levelUpAt}`);
    }

    console.log('\n--- Recent Practices ---');
    const practices = await prisma.skill_practices.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
        // Wait, checking schema for skill_practices
    });
    // skill_practices schema check from snippet earlier (step 8651):
    // 646:   id          String   @id @default(uuid())
    // 647:   studentId   String
    // ...
    // No createdAt shown in snippet? Snippet ended at 650.
    // I'll assume no createdAt for now or just take any.
    console.log(`Practices count: ${practices.length}`);
    if (practices.length > 0) {
        console.log('Sample practice:', JSON.stringify(practices[0]));
    }
}

main().finally(() => prisma.$disconnect());
