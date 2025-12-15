import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function migrateLegacyData() {
  console.log('🚀 开始遗留数据迁移...');

  try {
    // 1. 检查是否已有学生数据
    const existingStudentsCount = await prisma.student.count();
    console.log(`👥 现有学生数量: ${existingStudentsCount}`);

    if (existingStudentsCount > 0) {
      console.log('✅ 数据库已有数据，跳过迁移');
      return;
    }

    // 2. 检查是否有遗留数据
    console.log('🔍 检查遗留数据库...');
    const hasLegacyData = await checkLegacyDatabase();

    if (hasLegacyData) {
      console.log('📦 发现遗留数据，开始迁移...');
      await performLegacyMigration();
    } else {
      console.log('⚠️  未发现遗留数据，创建测试数据...');
      await createDummyData();
    }

    // 2. 创建默认学校
    console.log('🏫 创建默认学校...');
    const existingSchool = await prisma.school.findFirst({
      where: { name: 'Default Migration School' }
    });

    let school;
    if (existingSchool) {
      school = existingSchool;
      console.log(`✅ 使用现有学校: ${school.name} (${school.id})`);
    } else {
      school = await prisma.school.create({
        data: {
          name: 'Default Migration School'
        }
      });
      console.log(`✅ 创建学校: ${school.name} (${school.id})`);
    }

    // 3. 创建默认管理员教师
    console.log('👨‍🏫 创建默认教师...');
    const existingTeacher = await prisma.teacher.findFirst({
      where: { username: 'admin' }
    });

    let teacher;
    if (existingTeacher) {
      teacher = existingTeacher;
      console.log(`✅ 使用现有教师: ${teacher.name} (${teacher.username})`);
    } else {
      const hashedPassword = await bcrypt.hash('password123', 12);
      teacher = await prisma.teacher.create({
        data: {
          schoolId: school.id,
          username: 'admin',
          password: hashedPassword,
          name: '系统管理员',
          role: 'ADMIN'
        }
      });
      console.log(`✅ 创建教师: ${teacher.name} (${teacher.username})`);
    }

    // 4. 迁移学生数据
    console.log('👥 开始迁移学生数据...');

    // 获取遗留学生数据
    const legacyStudents = await prisma.$queryRaw`
      SELECT
        id,
        name,
        class_name as "className",
        level,
        score as "points",
        total_exp as "exp",
        avatar_url as "avatarUrl",
        is_active as "isActive",
        created_at as "createdAt"
      FROM students
      ORDER BY id
    ` as Array<{
      id: string;
      name: string;
      className: string;
      level: number;
      points: number;
      exp: number;
      avatarUrl: string | null;
      isActive: boolean;
      createdAt: Date;
    }>;

    console.log(`📊 发现 ${legacyStudents.length} 个遗留学生记录`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const legacyStudent of legacyStudents) {
      // 检查是否已经迁移过
      const existingStudent = await prisma.student.findFirst({
        where: {
          schoolId: school.id,
          name: legacyStudent.name
        }
      });

      if (existingStudent) {
        console.log(`⏭️  跳过已存在的学生: ${legacyStudent.name}`);
        skippedCount++;
        continue;
      }

      try {
        await prisma.student.create({
          data: {
            schoolId: school.id,
            name: legacyStudent.name || '未知学生',
            className: legacyStudent.className || '默认班级',
            level: legacyStudent.level || 1,
            points: legacyStudent.points || 0,
            exp: legacyStudent.exp || 0,
            avatarUrl: legacyStudent.avatarUrl,
            isActive: legacyStudent.isActive ?? true
          }
        });

        console.log(`✅ 迁移学生: ${legacyStudent.name} (${legacyStudent.className})`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ 迁移学生失败 ${legacyStudent.name}:`, error);
      }
    }

    // 5. 迁移统计
    console.log('\n📈 迁移统计:');
    console.log(`   ✅ 成功迁移: ${migratedCount} 个学生`);
    console.log(`   ⏭️  跳过已存在: ${skippedCount} 个学生`);
    console.log(`   📊 总处理: ${legacyStudents.length} 个学生`);

    // 6. 验证迁移结果
    const totalStudents = await prisma.student.count({
      where: { schoolId: school.id }
    });

    console.log(`\n🎯 迁移完成！`);
    console.log(`   学校: ${school.name}`);
    console.log(`   学生总数: ${totalStudents}`);
    console.log(`   教师: ${teacher.name} (${teacher.username})`);
    console.log(`   默认密码: password123`);

  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 创建测试数据（当没有遗留表时）
async function createDummyData() {
  console.log('🎭 创建测试数据...');

  try {
    // 创建学校
    const school = await prisma.school.create({
      data: { name: 'Demo School' }
    });
    console.log(`✅ 创建测试学校: ${school.name}`);

    // 创建教师
    const hashedPassword = await bcrypt.hash('password123', 12);
    const teacher = await prisma.teacher.create({
      data: {
        schoolId: school.id,
        username: 'demo_teacher',
        password: hashedPassword,
        name: 'Demo Teacher',
        email: 'demo@arkok.com',
        role: 'TEACHER'
      }
    });
    console.log(`✅ 创建测试教师: ${teacher.name}`);

    // 创建测试学生
    const demoStudents = [
      { name: '张小明', className: '三年一班', level: 3, points: 850, exp: 1200 },
      { name: '李小红', className: '三年一班', level: 3, points: 920, exp: 1450 },
      { name: '王小强', className: '三年二班', level: 3, points: 780, exp: 1100 },
      { name: '赵小美', className: '三年二班', level: 3, points: 950, exp: 1600 },
      { name: '刘小华', className: '三年一班', level: 3, points: 880, exp: 1350 }
    ];

    for (const studentData of demoStudents) {
      await prisma.student.create({
        data: {
          schoolId: school.id,
          ...studentData
        }
      });
      console.log(`✅ 创建测试学生: ${studentData.name}`);
    }

    console.log('\n🎯 测试数据创建完成！');
    console.log(`   学校: ${school.name}`);
    console.log(`   教师: ${teacher.name} (用户名: ${teacher.username})`);
    console.log(`   学生数: ${demoStudents.length}`);
    console.log(`   默认密码: password123`);

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 检查遗留数据库
async function checkLegacyDatabase(): Promise<boolean> {
  try {
    // 尝试连接到arkok数据库检查遗留表
    const legacyPrisma = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://postgres:kngwb5cb@growark-postgresql.ns-bg6fgs6y.svc:5432/arkok"
        }
      }
    });

    // 检查students表是否存在
    const tableCheck = await legacyPrisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'students'
    ` as Array<{ table_name: string }>;

    const hasLegacyTable = tableCheck.length > 0;

    if (hasLegacyTable) {
      // 检查是否有数据
      const studentCount = await legacyPrisma.$queryRaw`
        SELECT COUNT(*) as count FROM students
      ` as Array<{ count: number }>;

      const hasData = (studentCount[0]?.count ?? 0) > 0;

      await legacyPrisma.$disconnect();
      return hasData;
    }

    await legacyPrisma.$disconnect();
    return false;
  } catch (error) {
    console.log('ℹ️  无法连接到遗留数据库:', (error as Error).message);
    return false;
  }
}

// 执行遗留数据迁移
async function performLegacyMigration() {
  try {
    const legacyPrisma = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://postgres:kngwb5cb@growark-postgresql.ns-bg6fgs6y.svc:5432/arkok"
        }
      }
    });

    // 1. 创建迁移学校
    console.log('🏫 创建迁移学校...');
    const school = await prisma.school.create({
      data: {
        name: 'ArkOK V2 迁移学校',
        planType: 'PRO',
        isActive: true
      }
    });
    console.log(`✅ 创建学校: ${school.name} (${school.id})`);

    // 2. 创建默认管理员教师
    console.log('👨‍🏫 创建管理员教师...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const teacher = await prisma.teacher.create({
      data: {
        schoolId: school.id,
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        role: 'ADMIN'
      }
    });
    console.log(`✅ 创建教师: ${teacher.name} (${teacher.username})`);

    // 3. 获取遗留学生数据
    console.log('👥 获取遗留学生数据...');
    const legacyStudents = await legacyPrisma.$queryRaw`
      SELECT * FROM students ORDER BY id
    ` as Array<{
      id: string;
      name: string;
      class_name?: string;
      className?: string;
      level?: number;
      score?: number;
      points?: number;
      total_exp?: number;
      exp?: number;
      avatar_url?: string;
      avatarUrl?: string;
      is_active?: boolean;
      isActive?: boolean;
    }>;

    console.log(`📊 发现 ${legacyStudents.length} 个遗留学生`);

    // 4. 迁移学生数据
    let migratedCount = 0;
    for (const legacyStudent of legacyStudents) {
      try {
        await prisma.student.create({
          data: {
            schoolId: school.id,
            name: legacyStudent.name || '未知学生',
            className: legacyStudent.className || legacyStudent.class_name || '默认班级',
            level: legacyStudent.level || 1,
            points: legacyStudent.points || legacyStudent.score || 0,
            exp: legacyStudent.exp || legacyStudent.total_exp || 0,
            avatarUrl: legacyStudent.avatarUrl || legacyStudent.avatar_url,
            isActive: legacyStudent.isActive ?? legacyStudent.is_active ?? true
          }
        });
        migratedCount++;
        console.log(`✅ 迁移学生: ${legacyStudent.name}`);
      } catch (error) {
        console.error(`❌ 迁移学生失败 ${legacyStudent.name}:`, error);
      }
    }

    console.log(`\n🎯 迁移统计:`);
    console.log(`   ✅ 成功迁移: ${migratedCount} 个学生`);
    console.log(`   📊 总发现: ${legacyStudents.length} 个学生`);

    await legacyPrisma.$disconnect();

  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
    throw error;
  }
}

// 执行迁移
if (require.main === module) {
  migrateLegacyData()
    .then(() => {
      console.log('\n🎉 数据迁移成功完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 数据迁移失败:', error);
      process.exit(1);
    });
}

export { migrateLegacyData, createDummyData, checkLegacyDatabase, performLegacyMigration };