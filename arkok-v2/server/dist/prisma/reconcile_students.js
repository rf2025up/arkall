"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- Starting Student Reconciliation Script ---');
    // 1. 找到 admin 用户及其学校ID
    const adminUser = await prisma.teacher.findFirst({ where: { username: 'admin' } });
    if (!adminUser || !adminUser.schoolId) {
        console.error('❌ Critical Error: Admin user or their school not found!');
        return;
    }
    const targetSchoolId = adminUser.schoolId;
    console.log(`🎯 Found admin user. Target School ID is: ${targetSchoolId}`);
    // 2. 找到所有不属于该学校的学生 (那些迁移过来的学生)
    const strayStudents = await prisma.student.findMany({
        where: {
            NOT: { schoolId: targetSchoolId },
        },
    });
    if (strayStudents.length === 0) {
        console.log('✅ No stray students found. All students are correctly assigned.');
        return;
    }
    console.log(`🔍 Found ${strayStudents.length} students to reconcile.`);
    console.log(`Students to reconcile:`, strayStudents.map(s => ({ id: s.id, name: s.name, currentSchoolId: s.schoolId })));
    // 3. 将这些学生更新到正确的学校
    const updateResult = await prisma.student.updateMany({
        where: {
            id: { in: strayStudents.map(s => s.id) },
        },
        data: {
            schoolId: targetSchoolId,
        },
    });
    console.log(`✅ Successfully reconciled ${updateResult.count} students!`);
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=reconcile_students.js.map