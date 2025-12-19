import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🌱 创建测试数据...');

    // 创建学校
    const school = await prisma.school.upsert({
      where: { id: 'test-school-123' },
      update: {},
      create: {
        id: 'test-school-123',
        name: '测试学校',
        settings: {
          address: '测试地址',
          phone: '123-456-7890',
          principalName: '测试校长'
        }
      }
    });
    console.log('✅ 学校创建成功:', school.name);

    // 创建老师
    const teacher = await prisma.teacher.upsert({
      where: { username: 'testteacher' },
      update: {},
      create: {
        username: 'testteacher',
        password: await bcrypt.hash('test123', 10),
        name: '测试老师',
        email: 'teacher@test.com',
        schoolId: school.id
      }
    });
    console.log('✅ 老师创建成功:', teacher.name);

    // 创建学生
    const student = await prisma.student.upsert({
      where: { id: 'test-student-123' },
      update: {},
      create: {
        id: 'test-student-123',
        name: '测试学生',
        schoolId: school.id,
        teacherId: teacher.id,
        className: '测试班级',
        isActive: true
      }
    });
    console.log('✅ 学生创建成功:', student.name);

    // 创建教学计划（包含课程进度）
    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        schoolId: school.id,
        teacherId: teacher.id,
        title: '测试教学计划',
        content: {
          courseInfo: {
            chinese: { unit: "3", lesson: "2", title: "古诗二首" },
            math: { unit: "2", lesson: "1", title: "两位数加法" },
            english: { unit: "1", title: "My Family" }
          },
          tasks: {
            qcTasks: [
              { taskName: "作业质量检查", category: "质检", difficulty: 1, defaultExp: 5 }
            ],
            normalTasks: [
              { taskName: "完成数学作业", category: "基础核心", difficulty: 2, defaultExp: 10 }
            ]
          }
        },
        date: new Date(),
        isActive: true
      }
    });
    console.log('✅ 教学计划创建成功:', lessonPlan.title);

    // 为学生创建任务记录
    const taskRecord = await prisma.taskRecord.create({
      data: {
        schoolId: school.id,
        studentId: student.id,
        lessonPlanId: lessonPlan.id,
        type: 'TASK',
        title: '完成数学作业',
        content: { category: '基础核心', difficulty: 2 },
        status: 'PENDING',
        expAwarded: 10
      }
    });
    console.log('✅ 任务记录创建成功:', taskRecord.title);

    console.log('\n🎉 测试数据创建完成！');
    console.log('📝 登录信息:');
    console.log('   老师账号: testteacher / test123');
    console.log('   学生ID:', student.id, '(学生通过老师账户访问)');
    console.log('   学校ID:', school.id);

    // 测试登录并获取token
    const { AuthService } = await import('./src/services/auth.service');
    const authService = new AuthService(prisma);
    const teacherLogin = await authService.login({
      username: 'testteacher',
      password: 'test123'
    });
    console.log('\n🔑 老师Token:', teacherLogin.token?.substring(0, 50) + '...');

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();