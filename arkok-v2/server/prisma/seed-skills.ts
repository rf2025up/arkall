/**
 * 五维内功修炼系统 - 技能预置数据
 * 运行: npx ts-node prisma/seed-skills.ts
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 技能定义数据
const skillsData = [
    // ==================== 🟥 内省力 (Reflection) ====================
    {
        code: 'r_color', name: '三色修补术', attribute: 'reflection', category: '内省力',
        levelData: [{ lvl: 1, exp: 5, title: '纠错学徒' }, { lvl: 2, exp: 20, title: '订正能手' }, { lvl: 3, exp: 50, title: '治愈大师' }]
    },
    {
        code: 'r_scan', name: '雷达自检眼', attribute: 'reflection', category: '内省力',
        levelData: [{ lvl: 1, exp: 3, title: '扫雷兵' }, { lvl: 2, exp: 15, title: '质检员' }, { lvl: 3, exp: 40, title: '免检金牌' }]
    },
    {
        code: 'r_diagnosis', name: '试卷体检法', attribute: 'reflection', category: '内省力',
        levelData: [{ lvl: 1, exp: 2, title: '查病单' }, { lvl: 2, exp: 8, title: '诊疗师' }, { lvl: 3, exp: 20, title: '神医圣手' }]
    },
    {
        code: 'r_diary', name: '日悟心法', attribute: 'reflection', category: '内省力',
        levelData: [{ lvl: 1, exp: 7, title: '记录者' }, { lvl: 2, exp: 21, title: '内省者' }, { lvl: 3, exp: 60, title: '觉悟者' }]
    },
    {
        code: 'r_gap', name: '盲区探照灯', attribute: 'reflection', category: '内省力',
        levelData: [{ lvl: 1, exp: 5, title: '提问生' }, { lvl: 2, exp: 20, title: '补漏匠' }, { lvl: 3, exp: 50, title: '无缺公子' }]
    },
    {
        code: 'r_detail', name: '细读定身咒', attribute: 'reflection', category: '内省力',
        levelData: [{ lvl: 1, exp: 10, title: '圈词人' }, { lvl: 2, exp: 30, title: '审题王' }, { lvl: 3, exp: 80, title: '火眼金睛' }]
    },

    // ==================== 🟦 逻辑力 (Logic) ====================
    {
        code: 'l_source', name: '母题溯源眼', attribute: 'logic', category: '逻辑力',
        levelData: [{ lvl: 1, exp: 3, title: '寻源者' }, { lvl: 2, exp: 10, title: '破题手' }, { lvl: 3, exp: 30, title: '通透宗师' }]
    },
    {
        code: 'l_draft', name: '思维草图术', attribute: 'logic', category: '逻辑力',
        levelData: [{ lvl: 1, exp: 5, title: '草稿新手' }, { lvl: 2, exp: 20, title: '绘图师' }, { lvl: 3, exp: 50, title: '推演专家' }]
    },
    {
        code: 'l_struct', name: '结构解牛刀', attribute: 'logic', category: '逻辑力',
        levelData: [{ lvl: 1, exp: 3, title: '拆书匠' }, { lvl: 2, exp: 10, title: '架构师' }, { lvl: 3, exp: 30, title: '全知视界' }]
    },
    {
        code: 'l_compare', name: '异同辨析手', attribute: 'logic', category: '逻辑力',
        levelData: [{ lvl: 1, exp: 3, title: '辨字员' }, { lvl: 2, exp: 10, title: '明眼人' }, { lvl: 3, exp: 30, title: '鉴别大师' }]
    },
    {
        code: 'l_model', name: '万能模型卡', attribute: 'logic', category: '逻辑力',
        levelData: [{ lvl: 1, exp: 2, title: '模具工' }, { lvl: 2, exp: 8, title: '建模师' }, { lvl: 3, exp: 20, title: '举一反三' }]
    },
    {
        code: 'l_connect', name: '知识串联桥', attribute: 'logic', category: '逻辑力',
        levelData: [{ lvl: 1, exp: 2, title: '织网蛛' }, { lvl: 2, exp: 5, title: '筑桥师' }, { lvl: 3, exp: 15, title: '体系构建者' }]
    },

    // ==================== 🟨 自主力 (Autonomy) ====================
    {
        code: 'a_feynman', name: '费曼传道', attribute: 'autonomy', category: '自主力',
        levelData: [{ lvl: 1, exp: 3, title: '小助教' }, { lvl: 2, exp: 15, title: '讲坛新秀' }, { lvl: 3, exp: 40, title: '传道教授' }]
    },
    {
        code: 'a_bloom', name: '字字开花', attribute: 'autonomy', category: '自主力',
        levelData: [{ lvl: 1, exp: 10, title: '采花童' }, { lvl: 2, exp: 50, title: '词汇库' }, { lvl: 3, exp: 200, title: '博学文曲' }]
    },
    {
        code: 'a_hunt', name: '素材捕捉手', attribute: 'autonomy', category: '自主力',
        levelData: [{ lvl: 1, exp: 5, title: '拾贝者' }, { lvl: 2, exp: 20, title: '收藏家' }, { lvl: 3, exp: 60, title: '生活智者' }]
    },
    {
        code: 'a_ask', name: '追问求索心', attribute: 'autonomy', category: '自主力',
        levelData: [{ lvl: 1, exp: 5, title: '好奇宝宝' }, { lvl: 2, exp: 15, title: '探究员' }, { lvl: 3, exp: 40, title: '真理追求者' }]
    },
    {
        code: 'a_help', name: '侠义助人', attribute: 'autonomy', category: '自主力',
        levelData: [{ lvl: 1, exp: 5, title: '热心肠' }, { lvl: 2, exp: 20, title: '及时雨' }, { lvl: 3, exp: 50, title: '侠之大者' }]
    },
    {
        code: 'a_life', name: '生活算术师', attribute: 'autonomy', category: '自主力',
        levelData: [{ lvl: 1, exp: 2, title: '应用生' }, { lvl: 2, exp: 8, title: '精算师' }, { lvl: 3, exp: 20, title: '实干家' }]
    },

    // ==================== 🟩 规划力 (Planning) ====================
    {
        code: 'p_helm', name: '掌舵规划术', attribute: 'planning', category: '规划力',
        levelData: [{ lvl: 1, exp: 2, title: '水手' }, { lvl: 2, exp: 8, title: '大副' }, { lvl: 3, exp: 20, title: '传奇船长' }]
    },
    {
        code: 'p_scout', name: '前哨侦查兵', attribute: 'planning', category: '规划力',
        levelData: [{ lvl: 1, exp: 5, title: '探路者' }, { lvl: 2, exp: 20, title: '先锋官' }, { lvl: 3, exp: 50, title: '预知未来' }]
    },
    {
        code: 'p_bag', name: '粮草先行官', attribute: 'planning', category: '规划力',
        levelData: [{ lvl: 1, exp: 7, title: '整理员' }, { lvl: 2, exp: 30, title: '管家' }, { lvl: 3, exp: 90, title: '井井有条' }]
    },
    {
        code: 'p_tomato', name: '番茄时钟法', attribute: 'planning', category: '规划力',
        levelData: [{ lvl: 1, exp: 10, title: '守时者' }, { lvl: 2, exp: 40, title: '效率达人' }, { lvl: 3, exp: 100, title: '时间领主' }]
    },
    {
        code: 'p_priority', name: '要事第一策', attribute: 'planning', category: '规划力',
        levelData: [{ lvl: 1, exp: 5, title: '排序员' }, { lvl: 2, exp: 20, title: '执行官' }, { lvl: 3, exp: 60, title: '运筹帷幄' }]
    },

    // ==================== 🟧 毅力值 (Grit) ====================
    {
        code: 'g_zen', name: '定力禅修', attribute: 'grit', category: '毅力值',
        levelData: [{ lvl: 1, exp: 5, title: '静心' }, { lvl: 2, exp: 20, title: '入定' }, { lvl: 3, exp: 60, title: '金刚不坏' }]
    },
    {
        code: 'g_streak', name: '薪火相传', attribute: 'grit', category: '毅力值',
        levelData: [{ lvl: 1, exp: 7, title: '点火者' }, { lvl: 2, exp: 21, title: '持炬人' }, { lvl: 3, exp: 100, title: '永恒之火' }]
    },
    {
        code: 'g_retry', name: '百折不挠', attribute: 'grit', category: '毅力值',
        levelData: [{ lvl: 1, exp: 3, title: '挑战者' }, { lvl: 2, exp: 10, title: '破壁人' }, { lvl: 3, exp: 30, title: '逆境战神' }]
    },
    {
        code: 'g_drill', name: '千锤百炼', attribute: 'grit', category: '毅力值',
        levelData: [{ lvl: 1, exp: 20, title: '苦修僧' }, { lvl: 2, exp: 80, title: '基本功王' }, { lvl: 3, exp: 200, title: '肌肉记忆' }]
    },
    {
        code: 'g_accum', name: '滴水穿石', attribute: 'grit', category: '毅力值',
        levelData: [{ lvl: 1, exp: 10, title: '积水潭' }, { lvl: 2, exp: 50, title: '汇川河' }, { lvl: 3, exp: 200, title: '汪洋海' }]
    }
];

async function seedSkills() {
    console.log('🎯 开始导入技能数据...');

    for (const skill of skillsData) {
        const existing = await prisma.skills.findUnique({ where: { code: skill.code } });
        if (existing) {
            console.log(`  ⏭️  技能已存在: ${skill.name}`);
            continue;
        }

        await prisma.skills.create({
            data: {
                code: skill.code,
                name: skill.name,
                attribute: skill.attribute,
                category: skill.category,
                levelData: skill.levelData,
                unlockExp: skill.levelData[0].exp  // L1所需经验
            }
        });
        console.log(`  ✅ 已创建技能: ${skill.name}`);
    }

    const count = await prisma.skills.count();
    console.log(`\\n🎉 技能库导入完成！共 ${count} 个技能。`);
}

seedSkills()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
