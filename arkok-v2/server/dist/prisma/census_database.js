"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- 🚀 Starting Full Database Census 🚀 ---');
    // --- 普查第一部分：学校户籍 ---
    console.log("\n--- 1. School Census: Listing all schools and their student counts ---");
    const schools = await prisma.school.findMany({
        include: {
            _count: {
                select: { students: true },
            },
        },
    });
    if (schools.length === 0) {
        console.log("❌ CRITICAL: No schools found in the database!");
    }
    else {
        console.log(`✅ Found ${schools.length} school(s):`);
        schools.forEach(school => {
            console.log(`  - School Name: "${school.name}", ID: ${school.id}, Registered Students: ${school._count.students}`);
        });
    }
    // --- 普查第二部分：教师/管理员户籍 ---
    console.log("\n--- 2. Teacher Census: Auditing all teachers and their school affiliations ---");
    const teachers = await prisma.teacher.findMany();
    if (teachers.length === 0) {
        console.log("❌ CRITICAL: No teachers found.");
    }
    else {
        console.log(`✅ Found ${teachers.length} teacher(s):`);
        teachers.forEach(teacher => {
            console.log(`  - Teacher: "${teacher.username}" (${teacher.name}), Role: ${teacher.role}, Affiliated School ID: ${teacher.schoolId}`);
        });
    }
    // --- 普查第三部分：学生花名册 (最关键！) ---
    console.log("\n--- 3. Student Census: Listing ALL students in the entire database ---");
    const allStudents = await prisma.student.findMany({
        select: {
            id: true,
            name: true,
            className: true,
            schoolId: true,
            isActive: true, // 检查激活状态
        },
        orderBy: {
            name: 'asc'
        }
    });
    console.log(`✅ TOTAL STUDENTS FOUND IN DATABASE: ${allStudents.length}`);
    if (allStudents.length > 0) {
        console.log("\n  --- Full Student Roster ---");
        allStudents.forEach(student => {
            console.log(`  - Name: ${student.name.padEnd(15)} | Class: ${(student.className || 'N/A').padEnd(15)} | School ID: ${student.schoolId} | IsActive: ${student.isActive}`);
        });
    }
    console.log('\n--- ✨ Census Complete ✨ ---');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=census_database.js.map