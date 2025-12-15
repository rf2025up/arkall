import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- 🔍 Exploring Database Structure 🔍 ---');

  try {
    // 1. 查看数据库中所有表
    console.log("\n1. Listing all tables in the database...");
    const allTables = await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log("Available tables:");
    (allTables as any[]).forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // 2. 尝试查看 students 表的结构
    console.log("\n2. Exploring 'students' table structure...");
    try {
      const studentsStructure = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'students'
        ORDER BY ordinal_position
      `);
      console.log("Students table columns:");
      (studentsStructure as any[]).forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // 3. 查看一些示例数据
      console.log("\n3. Sample data from students table...");
      const sampleData = await prisma.$queryRawUnsafe(`
        SELECT * FROM students LIMIT 5
      `);
      console.log("Sample records:");
      console.log(sampleData);

    } catch (error) {
      console.log("❌ Could not access 'students' table structure:", (error as Error).message);
    }

  } catch (error) {
    console.error("❌ Exploration failed:", error);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });