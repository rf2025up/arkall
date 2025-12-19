
import { LMSService } from './src/services/lms.service';
import { PrismaClient } from '@prisma/client';

async function verifyInternalFlow() {
  const prisma = new PrismaClient();
  const lmsService = new LMSService();

  console.log('🧪 开始 Service 层内部逻辑验证 (跳过 HTTP/Auth)...');

  try {
    // 1. 获取一个真实的教师和学生进行测试
    const teacher = await prisma.teachers.findFirst({ where: { username: 'long' } });
    if (!teacher) throw new Error('未找到老师 long');

    const student = await prisma.students.findFirst({
      where: { teacherId: teacher.id, isActive: true }
    });
    if (!student) throw new Error(`老师 ${teacher.id} 名下没有活跃学生`);

    console.log(`✅ 验证目标: 老师 [${teacher.username}] -> 学生 [${student.name}]`);

    // 2. 模拟备课发布请求
    const testPlanRequest = {
      schoolId: teacher.schoolId,
      teacherId: teacher.id,
      title: "Service 内部验证计划",
      content: {
        courseInfo: {
          chinese: { unit: "99", lesson: "9", title: "测试语文" },
          math: { unit: "99", lesson: "9", title: "测试数学" },
          english: { unit: "99", title: "Test Eng" }
        }
      },
      date: new Date(),
      progress: {
        chinese: { unit: "99", lesson: "9", title: "测试语文" }
      },
      tasks: [
        { type: 'QC' as any, title: "语文 Unit 99-9 过关项", expAwarded: 5, content: { category: '语文' } },
        { type: 'TASK' as any, title: "核心教学法任务", expAwarded: 10, content: { category: '教学法' } }
      ]
    };

    console.log('📡 正在通过 Service 发布计划...');
    // 模拟 Socket.io 实例
    const mockIo = { to: () => ({ emit: () => {} }) };

    const result = await lmsService.publishPlan(testPlanRequest as any, mockIo);
    console.log(`✅ 计划发布成功, LessonPlan ID: ${result.lessonPlan.id}`);

    // 3. 验证 TaskRecords 是否正确注入了 Unit/Lesson
    const records = await prisma.task_records.findMany({
      where: {
        lessonPlanId: result.lessonPlan.id,
        studentId: student.id
      }
    });

    console.log(`📊 检查生成的任务记录 (数量: ${records.length}):`);

    for (const record of records) {
      const content = record.content as any;
      console.log(`- 任务: [${record.title}]`);
      console.log(`  注入数据: unit=${content.unit}, lesson=${content.lesson}, taskName=${content.taskName}`);

      if (record.title.includes('语文') && (content.unit !== "99" || content.lesson !== "9")) {
        throw new Error('❌ 语文任务 Unit/Lesson 注入不匹配');
      }
    }

    console.log('🎉 Service 层逻辑验证通过：动态注入成功，无硬编码！');

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyInternalFlow();
