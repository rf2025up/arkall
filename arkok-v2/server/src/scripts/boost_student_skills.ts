
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const studentName = '龙卓豫';
    const student = await prisma.students.findFirst({
        where: { name: studentName }
    });

    if (!student) {
        console.log(`Student ${studentName} not found`);
        return;
    }

    console.log(`Boosting skills for ${student.name} (${student.id})...`);

    const skills = await prisma.student_skills.findMany({
        where: {
            studentId: student.id,
            level: 0
        },
        include: { skill: true }
    });

    for (const ss of skills) {
        const levelData = ss.skill.levelData as any[];
        // Find exp required for Level 1
        const l1 = levelData.find((l: any) => l.lvl === 1);
        const targetExp = l1 ? l1.exp : 5; // Default to 5 if not found

        if (ss.currentExp < targetExp) {
            await prisma.student_skills.update({
                where: { id: ss.id },
                data: {
                    currentExp: targetExp,
                    level: 1,
                    unlockedAt: new Date(),
                    levelUpAt: new Date()
                }
            });
            console.log(`Boosted ${ss.skill.name} to Level 1 (Exp: ${targetExp})`);

            // Also create a task record for timeline so it shows up
            await prisma.task_records.create({
                data: {
                    schoolId: student.schoolId,
                    studentId: student.id,
                    type: 'SKILL',
                    task_category: 'SKILL',
                    title: `点亮技能：${ss.skill.name} · ${l1?.title || '一级'}`,
                    content: {
                        skillCode: ss.skill.code,
                        level: 1,
                        expGained: targetExp - ss.currentExp,
                        skillName: ss.skill.name,
                        levelTitle: l1?.title || '一级'
                    },
                    status: 'COMPLETED',
                    expAwarded: 0,
                    isOverridden: false
                }
            });
        }
    }
    console.log('Done');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
