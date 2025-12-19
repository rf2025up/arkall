import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEducationalDomains() {
  try {
    console.log('🔍 检查任务库中的educationalDomain字段...\n');

    // 获取所有任务
    const tasks = await prisma.taskLibrary.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        educationalDomain: true,
        educationalSubcategory: true,
        defaultExp: true
      },
      orderBy: { educationalDomain: 'asc' }
    });

    console.log(`📊 总任务数量: ${tasks.length}\n`);

    // 按educationalDomain分组统计
    const domainStats = tasks.reduce((acc, task) => {
      const domain = task.educationalDomain || 'NULL';
      if (!acc[domain]) {
        acc[domain] = { count: 0, tasks: [] };
      }
      acc[domain].count++;
      acc[domain].tasks.push({
        name: task.name,
        category: task.category,
        subcategory: task.educationalSubcategory,
        exp: task.defaultExp
      });
      return acc;
    }, {} as Record<string, { count: number; tasks: any[] }>);

    console.log('📚 按educationalDomain分组统计:');
    Object.entries(domainStats).forEach(([domain, data]) => {
      console.log(`\n${domain}: ${data.count} 个任务`);
      if (domain !== 'NULL' && data.count <= 10) {
        data.tasks.forEach(task => {
          console.log(`  - ${task.name} (${task.category})`);
        });
      }
    });

    // 检查核心教学法任务详情
    const methodologyTasks = tasks.filter(task => task.educationalDomain === '核心教学法');
    console.log(`\n🎯 核心教学法任务详情 (${methodologyTasks.length}个):`);
    methodologyTasks.forEach(task => {
      console.log(`  - ${task.name} | ${task.educationalSubcategory} | ${task.category}`);
    });

    // 检查综合成长任务详情
    const growthTasks = tasks.filter(task => task.educationalDomain === '综合成长');
    console.log(`\n🌱 综合成长任务详情 (${growthTasks.length}个):`);
    growthTasks.forEach(task => {
      console.log(`  - ${task.name} | ${task.educationalSubcategory} | ${task.category}`);
    });

    // 检查基础作业任务详情
    const basicTasks = tasks.filter(task => task.educationalDomain === '基础作业');
    console.log(`\n📚 基础作业任务详情 (${basicTasks.length}个):`);
    basicTasks.slice(0, 10).forEach(task => {
      console.log(`  - ${task.name} | ${task.educationalSubcategory} | ${task.category}`);
    });
    if (basicTasks.length > 10) {
      console.log(`  ... 还有 ${basicTasks.length - 10} 个基础作业任务`);
    }

    // 检查NULL值的任务
    const nullDomainTasks = tasks.filter(task => !task.educationalDomain);
    if (nullDomainTasks.length > 0) {
      console.log(`\n⚠️ educationalDomain为NULL的任务 (${nullDomainTasks.length}个):`);
      nullDomainTasks.forEach(task => {
        console.log(`  - ${task.name} | ${task.category}`);
      });
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 数据库连接已断开');
  }
}

checkEducationalDomains();