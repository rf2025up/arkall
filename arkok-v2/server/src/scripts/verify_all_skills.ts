
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { skillService } from '../services/skill.service';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Verification for ALL Skills ---');

    // 1. Create a temporary test student
    const testStudentName = `TestSubject_${Date.now()}`;
    const school = await prisma.schools.findFirst();
    if (!school) throw new Error('No school found');

    const student = await prisma.students.create({
        data: {
            name: testStudentName,
            schoolId: school.id,
            level: 1,
            exp: 0,
            points: 0
        }
    });

    console.log(`Created test student: ${student.name} (${student.id})`);

    // 2. Get all skills
    const skills = await prisma.skills.findMany({
        where: { isActive: true }
    });
    console.log(`Found ${skills.length} active skills.`);

    // 3. Test loop
    for (const skill of skills) {
        process.stdout.write(`Testing Skill: ${skill.name} (${skill.code})... `);

        const levelData = skill.levelData as any[];
        const l1 = levelData.find((l: any) => l.lvl === 1);

        if (!l1) {
            console.log('Skipping (No L1 data)');
            continue;
        }

        const targetExp = l1.exp;
        let clicks = 0;
        let currentLevel = 0;

        // Simulate clicking until level up
        while (currentLevel < 1 && clicks < targetExp + 5) { // Safety break
            clicks++;
            const result = await skillService.recordPractice({
                studentId: student.id,
                skillCode: skill.code,
                expGained: 1, // Simulate 1 click = 1 exp
                certifiedBy: 'SYSTEM_TEST'
            });

            // Check DB state directly to be sure
            const ss = await prisma.student_skills.findUnique({
                where: { studentId_skillId: { studentId: student.id, skillId: skill.id } }
            });

            if (ss) {
                currentLevel = ss.level;
            }
        }

        if (currentLevel === 1) {
            console.log(`✅ Success! Reached L1 after ${clicks} clicks (Threshold: ${targetExp})`);

            // Verify Task Record
            const taskRecord = await prisma.task_records.findFirst({
                where: {
                    studentId: student.id,
                    type: 'SKILL',
                    title: { contains: skill.name }
                }
            });

            if (taskRecord) {
                // console.log(`   Task Record Created: ${taskRecord.title}`);
            } else {
                console.log(`   ❌ Task Record MISSING!`);
            }

        } else {
            console.log(`❌ Failed! Clicks: ${clicks}, Level: ${currentLevel}, Threshold: ${targetExp}`);
        }
    }

    // 4. Cleanup
    console.log('\nCleaning up test student...');
    await prisma.task_records.deleteMany({ where: { studentId: student.id } });
    await prisma.student_skills.deleteMany({ where: { studentId: student.id } });
    await prisma.students.delete({ where: { id: student.id } });
    console.log('Done.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
