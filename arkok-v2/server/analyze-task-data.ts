import { PrismaClient, Teacher } from '@prisma/client';

const prisma = new PrismaClient();

// 类型定义
interface TeacherInfo {
  id: string;
  name: string;
  role: string;
  schoolId: string;
}

interface StudentInfo {
  id: string;
  name: string;
  className: string | null;
  teacherId: string | null;
}

interface TaskRecordAnalysis {
  id: string;
  title: string;
  type: string;
  status: string;
  expAwarded: number;
  createdAt: Date;
  student: {
    id: string;
    name: string;
    teacherId: string | null;
    className: string | null;
  };
  lessonPlan?: {
    id: string;
    title: string;
    teacherId: string;
    date: Date;
  };
}

/**
 * 🔍 任务数据深度分析脚本 - 分析过关页面无任务的问题
 */
async function analyzeTaskData() {
  console.log('🔍 [TASK_ANALYSIS] 开始分析任务数据...');

  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 1. 基础数据统计
    console.log('\n📊 [TASK_ANALYSIS] === 基础数据统计 ===');
    const totalTasks = await prisma.taskRecord.count();
    const todayTasks = await prisma.taskRecord.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });
    const totalPlans = await prisma.lessonPlan.count();
    const todayPlans = await prisma.lessonPlan.count({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    console.log(`📈 任务记录总数: ${totalTasks}`);
    console.log(`📈 今日任务记录: ${todayTasks}`);
    console.log(`📈 教学计划总数: ${totalPlans}`);
    console.log(`📈 今日教学计划: ${todayPlans}`);

    // 2. 获取龙老师的ID
    console.log('\n👤 [TASK_ANALYSIS] === 龙老师信息 ===');
    const dragonTeacher: TeacherInfo | null = await prisma.teacher.findFirst({
      where: {
        name: '龙老师'
      },
      select: {
        id: true,
        name: true,
        role: true,
        schoolId: true
      }
    });

    if (!dragonTeacher) {
      console.log('❌ 未找到龙老师');
      return;
    }

    console.log(`✅ 找到龙老师: ${dragonTeacher.name} (${dragonTeacher.id})`);
    console.log(`   学校ID: ${dragonTeacher.schoolId}`);
    console.log(`   角色: ${dragonTeacher.role}`);

    // 3. 分析龙老师的学生
    console.log('\n👥 [TASK_ANALYSIS] === 龙老师的学生分析 ===');
    const dragonStudents: StudentInfo[] = await prisma.student.findMany({
      where: {
        teacherId: dragonTeacher.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        className: true,
        teacherId: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`👥 龙老师有 ${dragonStudents.length} 个学生:`);
    dragonStudents.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} (${student.id}) - ${student.className || '无班级'}`);
    });

    // 4. 分析龙老师发布的今日任务
    console.log('\n📚 [TASK_ANALYSIS] === 今日任务分析 ===');
    const todayTaskRecords: TaskRecordAnalysis[] = await prisma.taskRecord.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            teacherId: true,
            className: true
          }
        },
        lessonPlan: {
          select: {
            id: true,
            title: true,
            teacherId: true,
            date: true
          }
        }
      },
      orderBy: [
        { student: { name: 'asc' } },
        { type: 'asc' },
        { title: 'asc' }
      ]
    });

    console.log(`📝 今日共有 ${todayTaskRecords.length} 条任务记录:`);

    // 按学生分组显示
    const taskGroups = new Map<string, TaskRecordAnalysis[]>();
    for (const record of todayTaskRecords) {
      const studentKey = record.student.name;
      if (!taskGroups.has(studentKey)) {
        taskGroups.set(studentKey, []);
      }
      taskGroups.get(studentKey)!.push(record);
    }

    for (const [studentName, records] of taskGroups.entries()) {
      console.log(`\n   👤 学生: ${studentName}`);
      console.log(`      教师ID: ${records[0].student.teacherId}`);
      console.log(`      是否龙老师学生: ${records[0].student.teacherId === dragonTeacher.id ? '✅' : '❌'}`);
      console.log(`      班级: ${records[0].student.className || '无班级'}`);
      console.log(`      任务数量: ${records.length}`);

      records.forEach((record, index) => {
        console.log(`         ${index + 1}. [${record.type}] ${record.title} - ${record.status}`);
        console.log(`            任务ID: ${record.id}`);
        console.log(`            经验值: ${record.expAwarded}`);
        console.log(`            创建时间: ${record.createdAt.toISOString()}`);
        console.log(`            关联计划: ${record.lessonPlan?.title || '无'} (${record.lessonPlan?.teacherId || '无'})`);
      });
    }

    // 5. 模拟前端API调用测试
    console.log('\n🌐 [TASK_ANALYSIS] === 模拟前端API调用测试 ===');

    for (const student of dragonStudents) {
      console.log(`\n   🔍 测试学生 ${student.name} (${student.id}) 的任务记录查询:`);

      const studentRecords = await prisma.taskRecord.findMany({
        where: {
          studentId: student.id,
          createdAt: {
            gte: startOfToday,
            lte: endOfToday
          }
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          expAwarded: true,
          createdAt: true
        }
      });

      console.log(`      找到 ${studentRecords.length} 条记录:`);
      studentRecords.forEach((record, index) => {
        console.log(`         ${index + 1}. [${record.type}] ${record.title} - ${record.status} (+${record.expAwarded} EXP)`);
      });

      // 分析QC任务
      const qcRecords = studentRecords.filter(r => r.type === 'QC');
      console.log(`      其中QC任务: ${qcRecords.length} 条`);
      qcRecords.forEach((record, index) => {
        console.log(`         QC ${index + 1}: ${record.title} - ${record.status}`);
      });
    }

    // 6. 分析问题
    console.log('\n🔍 [TASK_ANALYSIS] === 问题分析 ===');

    if (todayTaskRecords.length === 0) {
      console.log('❌ 今日没有任务记录 - 可能是发布失败');
    } else {
      // 检查任务是否属于龙老师的学生
      const dragonStudentRecords = todayTaskRecords.filter(r =>
        dragonStudents.some(s => s.id === r.student.id)
      );

      console.log(`📊 总任务记录: ${todayTaskRecords.length}`);
      console.log(`📊 龙老师学生任务: ${dragonStudentRecords.length}`);

      if (dragonStudentRecords.length === 0) {
        console.log('❌ 关键问题: 任务记录存在，但都不属于龙老师的学生！');
        console.log('   可能原因: 发布时teacherId绑定错误，或者前端查询条件错误');
      } else {
        const qcTasks = dragonStudentRecords.filter(r => r.type === 'QC');
        console.log(`📊 龙老师学生QC任务: ${qcTasks.length} 条`);

        if (qcTasks.length === 0) {
          console.log('⚠️ 警告: 龙老师学生有任务，但没有QC任务');
          console.log('   过关页面只显示QC任务，所以看不到任何任务');
        }
      }
    }

  } catch (error) {
    console.error('❌ [TASK_ANALYSIS] 分析过程出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行分析
if (require.main === module) {
  analyzeTaskData().catch(console.error);
}