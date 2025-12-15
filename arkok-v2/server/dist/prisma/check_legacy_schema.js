"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkLegacySchema() {
    try {
        console.log('🔍 检查现有数据库表结构...');
        // 查看所有表
        const tables = await prisma.$queryRaw `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
        console.log('\n📋 现有表:');
        console.table(tables);
        // 检查students表的列
        const studentsColumns = await prisma.$queryRaw `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'students'
      ORDER BY ordinal_position
    `;
        console.log('\n👥 students表结构:');
        console.table(studentsColumns);
        // 查看示例数据
        try {
            const sampleStudents = await prisma.$queryRaw `
        SELECT * FROM students LIMIT 3
      `;
            console.log('\n📝 示例数据:');
            console.table(sampleStudents);
        }
        catch (error) {
            console.log('❌ 无法查询示例数据:', error.message);
        }
    }
    catch (error) {
        console.error('❌ 检查失败:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    checkLegacySchema();
}
//# sourceMappingURL=check_legacy_schema.js.map