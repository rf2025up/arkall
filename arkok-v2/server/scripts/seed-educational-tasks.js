const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const schools = await prisma.schools.findMany({ select: { id: true } });

    const tasks = [
        // === METHODOLOGY (能力训练 / 核心教学法) ===
        { domain: 'METHODOLOGY', sub: '数学思维', items: ['分步法讲解数学题', '画图法理解应用题', '口算限时挑战', '错题归类与规律发现'] },
        { domain: 'METHODOLOGY', sub: '语文能力', items: ['课文朗读与背诵', '阅读理解策略练习', '作文提纲与修改'] },
        { domain: 'METHODOLOGY', sub: '英语输出', items: ['口语对话练习', '听力理解训练'] },
        { domain: 'METHODOLOGY', sub: '学习方法', items: ['错题摘抄与归因', '自评当日作业质量', '制定学习计划', '时间管理练习'] },

        // === HABIT (习惯培养 / 综合成长) ===
        { domain: 'HABIT', sub: '作业规范', items: ['作业的自主检查', '错题的红笔订正', '书写工整', '用"三色笔法"整理作业'] },
        { domain: 'HABIT', sub: '整理与贡献', items: ['离校前个人卫生清理', '离校前书包整理', '桌面整洁', '集体贡献任务'] },
        { domain: 'HABIT', sub: '学习姿态', items: ['坐姿端正', '认真听讲', '主动举手发言'] },

        // === GROWTH (综合成长) ===
        { domain: 'GROWTH', sub: '阅读素养', items: ['课外阅读30分钟', '阅读记录卡填写', '好词好句摘抄', '读后感分享'] },
        { domain: 'GROWTH', sub: '表达创新', items: ['阅读表达', '创意写作', '知识总结思维导图'] },
        { domain: 'GROWTH', sub: '家庭联结', items: ['与家人共读30分钟', '与家长分享学习内容', '帮家里完成家务'] },
        { domain: 'GROWTH', sub: '互助合作', items: ['帮助同学讲解', '小组讨论参与'] }
    ];

    console.log(`🚀 Starting seeding for ${schools.length} schools...`);

    for (const school of schools) {
        console.log(`🏫 Seeding school: ${school.id}`);
        for (const group of tasks) {
            for (const itemName of group.items) {
                await prisma.task_library.upsert({
                    where: {
                        schoolId_educationalDomain_educationalSubcategory_name: {
                            schoolId: school.id,
                            educationalDomain: group.domain,
                            educationalSubcategory: group.sub,
                            name: itemName
                        }
                    },
                    update: {
                        category: group.sub, // Keep for backward compatibility
                        isActive: true
                    },
                    create: {
                        schoolId: school.id,
                        educationalDomain: group.domain,
                        educationalSubcategory: group.sub,
                        category: group.sub,
                        name: itemName,
                        type: 'TASK',
                        defaultExp: 10,
                        isActive: true
                    }
                });
            }
        }
    }

    console.log('✅ Seeding completed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
