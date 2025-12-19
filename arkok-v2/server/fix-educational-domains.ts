import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEducationalDomains() {
  try {
    console.log('🔧 开始修复任务库的educationalDomain字段...');

    // 检查当前数据状态
    const allTasks = await prisma.task_library.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        educationalDomain: true,
        educationalSubcategory: true
      }
    });

    console.log(`📊 总任务数量: ${allTasks.length}`);
    console.log('📋 当前数据状态:');

    const categoryStats = allTasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('按category分类:', categoryStats);

    // 修复策略：根据category设置educationalDomain和educationalSubcategory
    const updates = [];

    for (const task of allTasks) {
      let educationalDomain = task.educationalDomain;
      let educationalSubcategory = task.educationalSubcategory;
      let needsUpdate = false;

      // 如果educationalDomain为空，根据category推断
      if (!educationalDomain) {
        needsUpdate = true;

        // 根据category推断educationalDomain
        if (task.category === '核心教学法' || task.category === '特色教学') {
          educationalDomain = '核心教学法';
          educationalSubcategory = mapCategoryToSubcategory(task.name, '核心教学法');
        } else if (task.category === '综合成长' ||
                   task.category === '阅读训练' ||
                   task.category === '写作练习' ||
                   task.category === '语文巩固' ||
                   task.category === '数学巩固' ||
                   task.category === '英语提升') {
          educationalDomain = '综合成长';
          educationalSubcategory = mapCategoryToSubcategory(task.name, '综合成长');
        } else if (task.category === '基础作业' ||
                   task.category === '基础核心' ||
                   task.category === '语文过关' ||
                   task.category === '数学过关' ||
                   task.category === '英语过关') {
          educationalDomain = '基础作业';
          educationalSubcategory = mapCategoryToSubcategory(task.name, '基础作业');
        } else {
          // 默认归类
          educationalDomain = '基础作业';
          educationalSubcategory = task.category;
        }
      }

      if (needsUpdate) {
        updates.push({
          id: task.id,
          name: task.name,
          currentCategory: task.category,
          newEducationalDomain: educationalDomain,
          newEducationalSubcategory: educationalSubcategory
        });
      }
    }

    console.log(`\n🔧 需要更新的任务数量: ${updates.length}`);

    if (updates.length > 0) {
      // 批量更新
      console.log('📝 开始更新任务...');

      for (const update of updates) {
        await prisma.task_library.update({
          where: { id: update.id },
          data: {
            educationalDomain: update.newEducationalDomain,
            educationalSubcategory: update.newEducationalSubcategory
          }
        });

        console.log(`✅ 已更新: ${update.name} | ${update.currentCategory} -> ${update.newEducationalDomain}/${update.newEducationalSubcategory}`);
      }
    }

    // 验证更新结果
    console.log('\n🔍 验证更新结果...');
    const updatedTasks = await prisma.task_library.findMany({
      select: {
        name: true,
        category: true,
        educationalDomain: true,
        educationalSubcategory: true
      }
    });

    const domainStats = updatedTasks.reduce((acc, task) => {
      acc[task.educationalDomain || 'NULL'] = (acc[task.educationalDomain || 'NULL'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('按educationalDomain分类:', domainStats);

    console.log('\n✅ educationalDomain字段修复完成！');

  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 辅助函数：将任务名称映射到具体的教育子分类
function mapCategoryToSubcategory(taskName: string, domain: string): string {
  if (domain === '核心教学法') {
    // 基础学习方法论
    if (taskName.includes('听写') || taskName.includes('背诵') || taskName.includes('朗读')) {
      return '基础学习方法论';
    }
    // 数学思维与解题策略
    if (taskName.includes('计算') || taskName.includes('公式') || taskName.includes('解题')) {
      return '数学思维与解题策略';
    }
    // 语言表达与写作
    if (taskName.includes('写作') || taskName.includes('表达') || taskName.includes('作文')) {
      return '语言表达与写作';
    }
    // 阅读理解与鉴赏
    if (taskName.includes('阅读') || taskName.includes('理解') || taskName.includes('鉴赏')) {
      return '阅读理解与鉴赏';
    }
    // 科学探究与实践
    if (taskName.includes('实验') || taskName.includes('探究') || taskName.includes('观察')) {
      return '科学探究与实践';
    }
    // 社会认知与参与
    if (taskName.includes('社会') || taskName.includes('历史') || taskName.includes('地理')) {
      return '社会认知与参与';
    }
    // 艺术审美与创造
    if (taskName.includes('艺术') || taskName.includes('音乐') || taskName.includes('美术')) {
      return '艺术审美与创造';
    }
    // 身心健康与运动
    if (taskName.includes('体育') || taskName.includes('健康') || taskName.includes('运动')) {
      return '身心健康与运动';
    }
    // 劳动技能与实践
    if (taskName.includes('劳动') || taskName.includes('技能') || taskName.includes('实践')) {
      return '劳动技能与实践';
    }
    return '其他教学法';
  }

  if (domain === '综合成长') {
    // 阅读广度类
    if (taskName.includes('阅读') || taskName.includes('读书')) {
      return '阅读广度类';
    }
    // 整理与贡献类
    if (taskName.includes('整理') || taskName.includes('清理') || taskName.includes('贡献')) {
      return '整理与贡献类';
    }
    // 互助与创新类
    if (taskName.includes('帮助') || taskName.includes('创新') || taskName.includes('合作')) {
      return '互助与创新类';
    }
    // 家庭联结类
    if (taskName.includes('家庭') || taskName.includes('家长') || taskName.includes('亲子')) {
      return '家庭联结类';
    }
    return '其他成长类';
  }

  if (domain === '基础作业') {
    // 语文过关
    if (taskName.includes('语文') || taskName.includes('生字') || taskName.includes('课文')) {
      return '语文过关';
    }
    // 数学过关
    if (taskName.includes('数学') || taskName.includes('计算') || taskName.includes('口算')) {
      return '数学过关';
    }
    // 英语过关
    if (taskName.includes('英语') || taskName.includes('单词') || taskName.includes('句型')) {
      return '英语过关';
    }
    return '基础核心';
  }

  return taskName; // 默认使用任务名称
}

fixEducationalDomains();