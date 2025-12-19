const { PrismaClient } = require('@prisma/client');

async function seedDefaultHabits() {
  const prisma = new PrismaClient();

  try {
    console.log('🌱 [HABIT_SEED] 开始添加默认习惯数据...');

    // 获取默认学校
    const defaultSchool = await prisma.school.findFirst({
      where: { name: { contains: 'Default' } }
    });

    if (!defaultSchool) {
      console.error('❌ [HABIT_SEED] 未找到默认学校，请先运行数据库迁移');
      return;
    }

    console.log(`🏫 [HABIT_SEED] 使用学校: ${defaultSchool.name} (ID: ${defaultSchool.id})`);

    const defaultHabits = [
      { name: '早起', icon: '🌅', expReward: 10, pointsReward: 5, description: '早起锻炼，精神饱满' },
      { name: '阅读', icon: '📚', expReward: 15, pointsReward: 8, description: '阅读书籍，增长知识' },
      { name: '运动', icon: '🏃', expReward: 20, pointsReward: 10, description: '运动健身，强健体魄' },
      { name: '整理', icon: '🧹', expReward: 10, pointsReward: 5, description: '整理物品，养成好习惯' },
      { name: '复习', icon: '📖', expReward: 25, pointsReward: 12, description: '复习功课，温故知新' },
      { name: '冥想', icon: '🧘', expReward: 15, pointsReward: 8, description: '冥想放松，专注内心' },
      { name: '目标', icon: '🎯', expReward: 20, pointsReward: 10, description: '制定目标，规划未来' },
      { name: '写作', icon: '✏️', expReward: 20, pointsReward: 10, description: '写作练习，提升表达' },
      { name: '绘画', icon: '🎨', expReward: 15, pointsReward: 8, description: '绘画创作，培养审美' },
      { name: '音乐', icon: '🎵', expReward: 15, pointsReward: 8, description: '音乐欣赏，陶冶情操' },
      { name: '创意', icon: '💡', expReward: 20, pointsReward: 10, description: '创意思考，激发潜能' },
      { name: '坚持', icon: '🌟', expReward: 30, pointsReward: 15, description: '坚持不懈，成就自我' },
      { name: '健康', icon: '🥗', expReward: 15, pointsReward: 8, description: '健康饮食，均衡营养' },
      { name: '力量', icon: '💪', expReward: 20, pointsReward: 10, description: '力量训练，强身健体' },
      { name: '口才', icon: '🗣️', expReward: 25, pointsReward: 12, description: '口才练习，提升沟通' }
    ];

    // 检查是否已有习惯数据
    const existingHabitsCount = await prisma.habit.count({
      where: { schoolId: defaultSchool.id }
    });

    if (existingHabitsCount > 0) {
      console.log(`ℹ️ [HABIT_SEED] 学校已有 ${existingHabitsCount} 个习惯，跳过初始化`);
      return;
    }

    // 批量创建默认习惯
    const createdHabits = await prisma.habit.createMany({
      data: defaultHabits.map(habit => ({
        ...habit,
        schoolId: defaultSchool.id,
        isActive: true
      }))
    });

    console.log(`✅ [HABIT_SEED] 成功创建 ${createdHabits.count} 个默认习惯`);

  } catch (error) {
    console.error('❌ [HABIT_SEED] 创建默认习惯失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDefaultHabits();