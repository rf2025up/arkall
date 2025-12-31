
import { PrismaClient } from '@prisma/client';
import { skillService } from '../src/services/skill.service';

const prisma = new PrismaClient();
// const skillService = new SkillService(); // Removed

async function main() {
    const name = '龙卓豫';
    console.log(`Searching for student: ${name}...`);

    const student = await prisma.students.findFirst({
        where: { name }
    });

    if (!student) {
        console.error('Student not found!');
        return;
    }

    console.log(`Found student: ${student.name} (${student.id})`);

    // Define 5 skills to level up (one from each dimension)
    const skillsToLevel = [
        'r_color', // Red
        'l_source', // Blue
        'a_feynman', // Yellow
        'p_helm', // Green
        'g_zen' // Orange
    ];

    for (const code of skillsToLevel) {
        console.log(`Adding exp to skill: ${code}...`);
        await skillService.recordPractice({
            studentId: student.id,
            skillCode: code,
            certifiedBy: 'SYSTEM_MANUAL',
            taskId: 'MANUAL_GRANT',
            note: '老师手动点亮'
        });
    }

    console.log('Done! All 5 skills updated.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
