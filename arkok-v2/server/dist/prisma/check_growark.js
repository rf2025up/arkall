"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGrowarkDatabase = checkGrowarkDatabase;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:kngwb5cb@growark-postgresql.ns-bg6fgs6y.svc:5432/growark"
        }
    }
});
async function checkGrowarkDatabase() {
    try {
        console.log('🔍 检查growark数据库...');
        // 列出所有表
        const tables = await prisma.$queryRaw `
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
        console.log('\n📋 growark数据库表:');
        console.table(tables);
        // 检查students表
        try {
            const studentCount = await prisma.$queryRaw `
        SELECT COUNT(*) as count FROM students
      `;
            console.log('\n👥 growark数据库学生数量:', studentCount[0]?.count || 0);
            if ((studentCount[0]?.count ?? 0) > 0) {
                console.log('✅ 发现遗留学生数据！');
                // 检查表结构
                const studentsColumns = await prisma.$queryRaw `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'students'
          ORDER BY ordinal_position
        `;
                console.log('\n🏗️ growark.students表结构:');
                console.table(studentsColumns);
                // 查看示例数据
                const sampleStudents = await prisma.$queryRaw `
          SELECT * FROM students LIMIT 5
        `;
                console.log('\n📝 示例学生数据:');
                console.table(sampleStudents);
                return true; // 有数据需要迁移
            }
        }
        catch (error) {
            console.log('ℹ️  growark数据库中没有students表:', error.message);
        }
        return false; // 无需迁移
    }
    catch (error) {
        console.error('❌ 检查growark数据库失败:', error);
        return false;
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    checkGrowarkDatabase();
}
//# sourceMappingURL=check_growark.js.map