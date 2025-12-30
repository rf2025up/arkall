// 清理今日创建的公开悬赏（CLASS 类型）测试数据
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanPublicBounties() {
    // 获取今日起始时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔍 查找今日创建的公开悬赏...');

    // 查找今日创建的 CLASS 类型挑战
    const bounties = await prisma.challenges.findMany({
        where: {
            type: 'CLASS',
            createdAt: { gte: today }
        },
        select: { id: true, title: true, createdAt: true }
    });

    console.log(`📋 找到 ${bounties.length} 条公开悬赏:`);
    bounties.forEach(b => console.log(`   - ${b.title} (${b.id})`));

    if (bounties.length === 0) {
        console.log('✅ 没有需要清理的数据');
        return;
    }

    // 删除相关的参与者记录
    const bountyIds = bounties.map(b => b.id);

    console.log('🧹 删除相关参与者记录...');
    const deletedParticipants = await prisma.challenge_participants.deleteMany({
        where: { challengeId: { in: bountyIds } }
    });
    console.log(`   已删除 ${deletedParticipants.count} 条参与者记录`);

    // 删除相关的任务记录
    console.log('🧹 删除相关任务记录...');
    const deletedTasks = await prisma.task_records.deleteMany({
        where: {
            type: 'CHALLENGE',
            content: { path: ['challengeId'], string_contains: bountyIds[0] }
        }
    });
    console.log(`   已删除 ${deletedTasks.count} 条任务记录`);

    // 删除挑战本身
    console.log('🧹 删除公开悬赏...');
    const deletedChallenges = await prisma.challenges.deleteMany({
        where: { id: { in: bountyIds } }
    });
    console.log(`   已删除 ${deletedChallenges.count} 条公开悬赏`);

    console.log('✅ 清理完成!');
}

cleanPublicBounties()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
