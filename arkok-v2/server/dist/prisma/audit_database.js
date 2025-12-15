"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- 🚀 Starting Database Deep Audit 🚀 ---');
    // --- 审计第一部分：学校情况 ---
    console.log("\n--- 1. Auditing Schools ---");
    const schools = await prisma.school.findMany({
        include: {
            _count: {
                select: { students: true },
            },
        },
    });
    if (schools.length === 0) {
        console.log("❌ No schools found in the database.");
    }
    else {
        console.log(`✅ Found ${schools.length} school(s):`);
        schools.forEach(school => {
            console.log(`  - School Name: "${school.name}", ID: ${school.id}, Student Count: ${school._count.students}`);
        });
    }
    // --- 审计第二部分：用户与学校的关联 ---
    console.log("\n--- 2. Auditing Users and School Association ---");
    const users = await prisma.teacher.findMany();
    if (users.length === 0) {
        console.log("❌ No users found.");
    }
    else {
        users.forEach((user) => {
            console.log(`  - User: "${user.username}", Role: ${user.role}, Associated School ID: ${user.schoolId}`);
        });
    }
    // --- 审计第三部分：学生总数与详细列表 ---
    console.log("\n--- 3. Auditing All Students (Regardless of School) ---");
    const allStudents = await prisma.student.findMany({
        select: {
            id: true,
            name: true,
            className: true,
            schoolId: true,
        },
    });
    console.log(`✅ TOTAL STUDENTS FOUND IN DATABASE: ${allStudents.length}`);
    if (allStudents.length > 0) {
        console.log("  --- Student Details ---");
        allStudents.forEach(student => {
            console.log(`  - Name: ${student.name.padEnd(15)}, Class: ${student.className.padEnd(15)}, Belongs to School ID: ${student.schoolId}`);
        });
    }
    console.log('\n--- ✨ Audit Complete ✨ ---');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=audit_database.js.map