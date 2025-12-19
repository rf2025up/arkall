const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SCHOOL_ID = '625e503b-aa7e-44fe-9982-237d828af717';
const STUDENT_ID = '1896c410-1a91-4281-ac02-797756c638cc'; // 宁可歆
const TEACHER_ID = '5ca64703-c978-4d01-bf44-a7568f34f556'; // 龙老师

async function main() {
  console.log('🔍 开始为宁可歆创建测试任务记录...');

  try {
    // 获取任务库中的QC任务
    const qcTasks = await prisma.taskLibrary.findMany({
      where: {
        type: 'QC',
        isActive: true
      }
    });

    console.log(`找到 ${qcTasks.length} 个QC任务`);

    if (qcTasks.length === 0) {
      console.log('❌ 没有找到QC类型的任务，创建一些基础任务...');

      // 创建一些基础的QC任务
      const basicQCTasks = [
        {
          id: 'qc-task-1',
          type: 'QC',
          title: '口算练习',
          description: '基础口算能力训练',
          category: '数学',
          difficulty: 'EASY',
          estimatedTime: 15,
          schoolId: SCHOOL_ID,
          isActive: true,
          unit: 1,
          lesson: 1
        },
        {
          id: 'qc-task-2',
          type: 'QC',
          title: '古诗背诵',
          description: '古诗文背诵能力训练',
          category: '语文',
          difficulty: 'EASY',
          estimatedTime: 20,
          schoolId: SCHOOL_ID,
          isActive: true,
          unit: 1,
          lesson: 2
        },
        {
          id: 'qc-task-3',
          type: 'QC',
          title: '应用题',
          description: '数学应用题解题能力',
          category: '数学',
          difficulty: 'MEDIUM',
          estimatedTime: 25,
          schoolId: SCHOOL_ID,
          isActive: true,
          unit: 2,
          lesson: 1
        },
        {
          id: 'qc-task-4',
          type: 'QC',
          title: '单词背诵',
          description: '英语单词记忆训练',
          category: '英语',
          difficulty: 'EASY',
          estimatedTime: 15,
          schoolId: SCHOOL_ID,
          isActive: true,
          unit: 2,
          lesson: 1
        },
        {
          id: 'qc-task-5',
          type: 'QC',
          title: '句型练习',
          description: '英语句型运用能力',
          category: '英语',
          difficulty: 'MEDIUM',
          estimatedTime: 20,
          schoolId: SCHOOL_ID,
          isActive: true,
          unit: 2,
          lesson: 1
        },
        {
          id: 'qc-task-6',
          type: 'QC',
          title: '生字听写',
          description: '汉字识别与书写能力',
          category: '语文',
          difficulty: 'EASY',
          estimatedTime: 15,
          schoolId: SCHOOL_ID,
          isActive: true,
          unit: 1,
          lesson: 2
        }
      ];

      await prisma.taskLibrary.createMany({
        data: basicQCTasks,
        skipDuplicates: true
      });

      console.log('✅ 已创建基础QC任务');
    }

    // 获取宁可歆现有的任务记录
    const existingRecords = await prisma.taskRecord.count({
      where: {
        studentId: STUDENT_ID,
        schoolId: SCHOOL_ID
      }
    });

    console.log(`宁可歆现有任务记录数: ${existingRecords}`);

    if (existingRecords === 0) {
      console.log('为宁可歆创建任务记录...');

      // 获取所有QC任务
      const allQCTasks = await prisma.taskLibrary.findMany({
        where: {
          type: 'QC',
          schoolId: SCHOOL_ID
        }
      });

      // 为宁可歆创建任务记录
      const taskRecords = allQCTasks.map(task => ({
        id: `record-${STUDENT_ID}-${task.id}`,
        studentId: STUDENT_ID,
        taskId: task.id,
        schoolId: SCHOOL_ID,
        type: 'QC',
        status: 'PENDING', // 待完成状态
        title: task.title,
        description: task.description,
        category: task.category,
        difficulty: task.difficulty,
        estimatedTime: task.estimatedTime,
        unit: task.unit,
        lesson: task.lesson,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await prisma.taskRecord.createMany({
        data: taskRecords,
        skipDuplicates: true
      });

      console.log(`✅ 为宁可歆创建了 ${taskRecords.length} 个任务记录`);
    }

    // 验证创建结果
    const finalRecords = await prisma.taskRecord.findMany({
      where: {
        studentId: STUDENT_ID,
        schoolId: SCHOOL_ID,
        type: 'QC'
      }
    });

    console.log(`🎉 宁可歆现在有 ${finalRecords.length} 个QC任务记录`);
    console.log('任务记录详情:');
    finalRecords.forEach(record => {
      console.log(`  - ${record.title} (${record.status})`);
    });

  } catch (error) {
    console.error('❌ 创建测试数据时发生错误:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n📝 数据库连接已关闭');
  }
}

main().catch(console.error);