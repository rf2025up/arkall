/**
 * 清理重复的演示学校
 * 
 * 1. 查找所有名为"演示学校"的校区
 * 2. 保留包含 demo1/demo2/demo3 账号的那个
 * 3. 删除其他重复的校区及其关联数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 查找所有演示学校...\n');

    // 1. 查找所有名为"演示学校"的校区
    const demoSchools = await prisma.schools.findMany({
        where: {
            name: '演示学校'
        },
        include: {
            teachers: {
                select: { id: true, username: true, name: true, role: true }
            },
            students: {
                select: { id: true, name: true }
            }
        }
    });

    console.log(`找到 ${demoSchools.length} 个演示学校:\n`);

    // 2. 找到正确的校区（包含 demo1 账号的）
    let correctSchool: typeof demoSchools[0] | null = null;
    const duplicateSchools: typeof demoSchools = [];

    for (const school of demoSchools) {
        const hasDemo1 = school.teachers.some(t => t.username === 'demo1');
        const hasDemo2 = school.teachers.some(t => t.username === 'demo2');
        const hasDemo3 = school.teachers.some(t => t.username === 'demo3');

        console.log(`📍 ${school.name} (ID: ${school.id})`);
        console.log(`   教师: ${school.teachers.map(t => `${t.username}(${t.name})`).join(', ') || '无'}`);
        console.log(`   学生数: ${school.students.length}`);
        console.log(`   有效账号: demo1=${hasDemo1}, demo2=${hasDemo2}, demo3=${hasDemo3}`);
        console.log('');

        if (hasDemo1 && hasDemo2 && hasDemo3) {
            if (!correctSchool) {
                correctSchool = school;
                console.log(`   ✅ 这是正确的演示学校，将保留\n`);
            } else {
                // 如果已经有正确的学校，这个也是重复的
                duplicateSchools.push(school);
                console.log(`   ⚠️ 重复的有效学校，将删除\n`);
            }
        } else {
            duplicateSchools.push(school);
            console.log(`   ❌ 缺少有效账号，将删除\n`);
        }
    }

    if (!correctSchool) {
        console.log('❌ 没有找到包含 demo1/demo2/demo3 账号的演示学校！');
        console.log('请先运行 generate-demo-data.ts 脚本创建正确的演示学校。');
        return;
    }

    console.log('='.repeat(60));
    console.log(`\n✅ 将保留: ${correctSchool.name} (${correctSchool.id})`);
    console.log(`❌ 将删除: ${duplicateSchools.length} 个重复校区\n`);

    if (duplicateSchools.length === 0) {
        console.log('没有需要删除的重复校区。');
        return;
    }

    // 3. 删除重复的校区
    console.log('开始删除重复校区...\n');

    for (const school of duplicateSchools) {
        console.log(`🗑️ 正在删除: ${school.name} (${school.id})...`);

        try {
            // Prisma 的 cascade 删除会自动处理关联数据
            await prisma.schools.delete({
                where: { id: school.id }
            });
            console.log(`   ✅ 已删除\n`);
        } catch (error: any) {
            console.error(`   ❌ 删除失败: ${error.message}\n`);
        }
    }

    console.log('='.repeat(60));
    console.log('\n✅ 清理完成！');
    console.log(`保留的演示学校: ${correctSchool.name} (${correctSchool.id})`);
    console.log(`包含账号: demo1, demo2, demo3`);
    console.log(`学生数: ${correctSchool.students.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
