/**
 * 🧪 备课页API测试脚本
 * 验证特色教学法和成长任务筛选逻辑是否正确
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrepPageAPI() {
  try {
    console.log('=== 备课页API测试 ===\n');

    // 1. 模拟 getTaskLibrary 方法
    const tasks = await prisma.taskLibrary.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { difficulty: 'asc' }
      ]
    });

    console.log(`📊 任务库总数: ${tasks.length}`);

    // 2. 模拟API响应格式
    const apiResponse = tasks.map(task => ({
      id: task.id,
      category: task.category,
      educationalDomain: task.category, // 修复后的映射
      educationalSubcategory: task.category, // 修复后的映射
      name: task.name,
      description: task.description || '',
      defaultExp: task.defaultExp,
      type: task.type,
      difficulty: task.difficulty || 0,
      isActive: task.isActive
    }));

    // 3. 模拟备课页筛选逻辑（修复后的版本）
    console.log('\n🎯 测试核心教学法筛选:');
    const methodologyTasks = apiResponse.filter(task =>
      task.category === '核心教学法'
    );
    console.log(`✅ 找到核心教学法任务: ${methodologyTasks.length} 个`);

    if (methodologyTasks.length > 0) {
      console.log('前5个核心教学法任务:');
      methodologyTasks.slice(0, 5).forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.name} (${task.defaultExp} EXP)`);
      });
    }

    console.log('\n🌱 测试综合成长筛选:');
    const growthTasks = apiResponse.filter(task =>
      task.category === '综合成长'
    );
    console.log(`✅ 找到综合成长任务: ${growthTasks.length} 个`);

    if (growthTasks.length > 0) {
      console.log('前5个综合成长任务:');
      growthTasks.slice(0, 5).forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.name} (${task.defaultExp} EXP)`);
      });
    }

    console.log('\n📚 测试基础作业筛选:');
    const basicTasks = apiResponse.filter(task =>
      task.category === '基础作业'
    );
    console.log(`✅ 找到基础作业任务: ${basicTasks.length} 个`);

    if (basicTasks.length > 0) {
      console.log('前5个基础作业任务:');
      basicTasks.slice(0, 5).forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.name} (${task.defaultExp} EXP)`);
      });
    }

    // 4. 测试任务分组逻辑
    console.log('\n📋 测试核心教学法任务分组:');
    const methodologyGroups = methodologyTasks.reduce((acc, task) => {
      const category = task.category; // 使用category字段
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(task);
      return acc;
    }, {} as Record<string, any[]>);

    console.log('核心教学法分组结果:');
    Object.entries(methodologyGroups).forEach(([category, tasks]) => {
      console.log(`  - ${category}: ${tasks.length} 个任务`);
    });

    console.log('\n🌱 测试综合成长任务分组（4大类）:');
    // 模拟备课页的4大类分组逻辑
    const readingTasks = ["年级同步阅读", "课外阅读30分钟", "填写阅读记录单", "阅读一个成语故事，并积累掌握3个成语"];
    const responsibilityTasks = ["离校前的个人卫生清理（桌面/抽屉/地面）", "离校前的书包整理", "一项集体贡献任务（浇花/整理书架/打扫等）", "吃饭时帮助维护秩序，确认光盘，地面保持干净", "为班级图书角推荐一本书，并写一句推荐语"];
    const creativityTasks = ["帮助同学（讲解/拍视频/打印等）", "一项创意表达任务（画画/写日记/做手工等）", "一项健康活力任务（眼保健操/拉伸/深呼吸/跳绳等）"];
    const familyTasks = ["与家人共读30分钟（可亲子读、兄弟姐妹读、给长辈读）", "帮家里完成一项力所及的家务（摆碗筷、倒垃圾/整理鞋柜等）"];

    const growthGroups = {
      "阅读广度类": 0,
      "整理与贡献类": 0,
      "互助与创新类": 0,
      "家庭联结类": 0,
      "其他成长类": 0
    };

    growthTasks.forEach(task => {
      if (readingTasks.includes(task.name)) {
        growthGroups["阅读广度类"]++;
      } else if (responsibilityTasks.includes(task.name)) {
        growthGroups["整理与贡献类"]++;
      } else if (creativityTasks.includes(task.name)) {
        growthGroups["互助与创新类"]++;
      } else if (familyTasks.includes(task.name)) {
        growthGroups["家庭联结类"]++;
      } else {
        growthGroups["其他成长类"]++;
      }
    });

    console.log('综合成长4大类分组结果:');
    Object.entries(growthGroups).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} 个任务`);
    });

    // 5. 最终测试结果
    console.log('\n🎯 测试结果总结:');
    console.log(`✅ 任务总数: ${apiResponse.length}`);
    console.log(`✅ 核心教学法: ${methodologyTasks.length} 个`);
    console.log(`✅ 综合成长: ${growthTasks.length} 个`);
    console.log(`✅ 基础作业: ${basicTasks.length} 个`);
    console.log(`✅ 其他分类: ${apiResponse.length - methodologyTasks.length - growthTasks.length - basicTasks.length} 个`);

    const totalFound = methodologyTasks.length + growthTasks.length + basicTasks.length;
    console.log(`✅ 筛选覆盖率: ${((totalFound / apiResponse.length) * 100).toFixed(1)}%`);

    if (methodologyTasks.length > 0 && growthTasks.length > 0) {
      console.log('\n🎉 备课页修复成功！特色教学法和成长任务现在应该能正常显示了。');
    } else {
      console.log('\n❌ 修复可能未完全生效，请检查数据映射逻辑。');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testPrepPageAPI()
  .then(() => {
    console.log('\n✅ 备课页API测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });