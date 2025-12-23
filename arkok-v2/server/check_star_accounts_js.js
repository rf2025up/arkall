const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- [DB_CHECK] 正在查询“星途与伴”校区数据 ---');
        const school = await prisma.schools.findFirst({
            where: { name: { contains: '星途' } }
        });

        if (school) {
            console.log(`✅ 找到校区: ${school.name} (ID: ${school.id})`);
            const teachers = await prisma.teachers.findMany({
                where: { schoolId: school.id },
                select: { username: true, name: true, role: true }
            });

            console.log(`📊 校区下共有 ${teachers.length} 个账号:`);
            teachers.forEach(t => {
                console.log(` - [${t.role}] 账号: ${t.username}, 姓名: ${t.name}`);
            });
        } else {
            console.log('❌ 未找到匹配“星途”名称的校区。');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
