
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const studentName = '宁可歆';
    const student = await prisma.students.findFirst({
        where: { name: studentName }
    });

    if (!student) {
        console.error(`Student ${studentName} not found!`);
        return;
    }

    console.log(`Found student: ${student.name} (${student.id})`);

    // Get 5 distinct skills
    const skills = await prisma.skills.findMany({
        where: { isActive: true },
        take: 5
    });

    if (skills.length < 5) {
        console.error('Not enough skills found!');
        return;
    }

    // Define target levels for the 5 skills: L1, L1, L2, L2, L3
    const targetLevels = [1, 1, 2, 2, 3];

    for (let i = 0; i < 5; i++) {
        const skill = skills[i];
        const targetLevel = targetLevels[i];
        const levelData = skill.levelData as any[];

        // Find configuration for the target level
        const config = levelData.find((l: any) => l.lvl === targetLevel);
        const expRequired = config?.exp || (targetLevel * 20); // Fallback
        const title = config?.title || `${targetLevel}级`;

        console.log(`Setting ${skill.name} to Level ${targetLevel} (${title}) for ${student.name}...`);

        // 1. Update/Create Student Skill
        const now = new Date();
        // Stagger times slightly so they don't look identical in lists
        now.setMinutes(now.getMinutes() - i * 5);

        await prisma.student_skills.upsert({
            where: {
                studentId_skillId: {
                    studentId: student.id,
                    skillId: skill.id
                }
            },
            update: {
                currentExp: expRequired,
                level: targetLevel,
                levelUpAt: now,
                unlockedAt: now // Assuming they unlocked just now or previously
            },
            create: {
                studentId: student.id,
                skillId: skill.id,
                currentExp: expRequired,
                level: targetLevel,
                levelUpAt: now,
                unlockedAt: now
            }
        });

        // 2. Create Task Record (Achievement)
        // We need to create a record for the *latest* achievement.
        await prisma.task_records.create({
            data: {
                schoolId: student.schoolId,
                studentId: student.id,
                type: 'SKILL',
                task_category: 'SKILL',
                title: `点亮技能：${skill.name} · ${title}`,
                content: {
                    skillCode: skill.code,
                    level: targetLevel,
                    expGained: 0, // Manual set
                    skillName: skill.name,
                    levelTitle: title,
                    timestamp: now.toISOString()
                },
                status: 'COMPLETED',
                expAwarded: 0,
                isOverridden: false,
                createdAt: now,
                updatedAt: now
            }
        });

        console.log(`✅ Generated: ${skill.name} Lv.${targetLevel}`);
    }

    console.log('All done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
