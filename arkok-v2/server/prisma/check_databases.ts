import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:kngwb5cb@growark-postgresql.ns-bg6fgs6y.svc:5432/postgres"
    }
  }
});

async function checkDatabases() {
  try {
    console.log('🔍 检查所有数据库...');

    // 列出所有数据库
    const databases = await prisma.$queryRaw`
      SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname
    `;

    console.log('\n📋 可用数据库:');
    console.table(databases);

    // 检查arkok数据库
    try {
      const arkokDb = new PrismaClient({
        datasources: {
          db: {
            url: "postgresql://postgres:kngwb5cb@growark-postgresql.ns-bg6fgs6y.svc:5432/arkok"
          }
        }
      });

      const arkokTables = await arkokDb.$queryRaw`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

      console.log('\n🏫 arkok数据库表:');
      console.table(arkokTables);

      // 检查学生数据
      try {
        const studentCount = await arkokDb.$queryRaw`
          SELECT COUNT(*) as count FROM students
        ` as Array<{ count: number }>;

        console.log('\n👥 arkok数据库学生数量:', studentCount[0]?.count || 0);

        if ((studentCount[0]?.count ?? 0) > 0) {
          const sampleStudents = await arkokDb.$queryRaw`
            SELECT * FROM students LIMIT 3
          `;

          console.log('\n📝 示例学生数据:');
          console.table(sampleStudents);

          // 检查表结构
          const studentsColumns = await arkokDb.$queryRaw`
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'students'
            ORDER BY ordinal_position
          `;

          console.log('\n🏗️ arkok.students表结构:');
          console.table(studentsColumns);
        }
      } catch (error) {
        console.log('❌ 检查arkok数据库学生数据失败:', (error as Error).message);
      }

      await arkokDb.$disconnect();
    } catch (error) {
      console.log('❌ 连接arkok数据库失败:', (error as Error).message);
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkDatabases();
}