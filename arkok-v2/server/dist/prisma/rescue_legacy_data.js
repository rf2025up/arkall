"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- 🚀 Starting Final Data Rescue Mission 🚀 ---');
    // 1. 确定数据救援的目标学校
    const adminUser = await prisma.teacher.findFirst({ where: { username: 'admin' } });
    if (!adminUser || !adminUser.schoolId) {
        throw new Error('❌ Critical Error: Cannot find admin user or their school!');
    }
    const rescueSchoolId = adminUser.schoolId;
    console.log(`🎯 Rescue destination is School ID: ${rescueSchoolId}`);
    // 2. 直接查询旧的 'students' 表 (最可能的名字)
    console.log("🔍 Attempting to read from legacy 'students' table...");
    const legacyStudents = await prisma.$queryRawUnsafe(`SELECT name, class_name, score, total_exp FROM students`);
    if (!legacyStudents || legacyStudents.length === 0) {
        throw new Error("❌ Critical Failure: Could not find or read from the legacy 'students' table. No data to rescue.");
    }
    console.log(`✅ Found ${legacyStudents.length} records in the legacy table. Beginning rescue operation...`);
    let rescuedCount = 0;
    let skippedCount = 0;
    // 3. 遍历并救援每一个学生
    for (const oldStudent of legacyStudents) {
        // 检查新表中是否已存在该学生，防止重复
        const existingStudent = await prisma.student.findFirst({
            where: {
                name: oldStudent.name,
                schoolId: rescueSchoolId,
            },
        });
        if (existingStudent) {
            console.log(`🟡 Skipping "${oldStudent.name}", already exists in the new database.`);
            skippedCount++;
            continue;
        }
        // 创建新学生记录
        await prisma.student.create({
            data: {
                name: oldStudent.name,
                className: oldStudent.class_name, // 映射旧的 class_name
                points: oldStudent.score, // 映射旧的 score
                exp: oldStudent.total_exp, // 映射旧的 total_exp
                level: Math.floor(oldStudent.total_exp / 100) + 1, // 自动计算等级
                schoolId: rescueSchoolId, // 归属到正确的学校
                avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${oldStudent.name}`,
            },
        });
        console.log(`✅ Rescued "${oldStudent.name}" successfully!`);
        rescuedCount++;
    }
    console.log(`\n--- ✨ Rescue Mission Complete ✨ ---`);
    console.log(`- Total students rescued: ${rescuedCount}`);
    console.log(`- Students skipped (duplicates): ${skippedCount}`);
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=rescue_legacy_data.js.map