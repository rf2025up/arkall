/**
 * 任务名 - 技能ID 映射表 (后端)
 * 用于在任务完成时自动关联技能修炼
 */
export const TASK_SKILL_MAPPING: Record<string, string> = {
    // ==================== 🟥 内省力 (Reflection) ====================
    '用"三色笔法"整理作业': 'r_color',
    '错题的红笔订正': 'r_color',
    '作业的自主检查': 'r_scan',
    '试卷体检法': 'r_diagnosis',
    '自评当日作业质量': 'r_diary',
    '错题的摘抄与归因': 'r_diagnosis',
    '记录并解决盲区问题': 'r_gap',
    '圈画审题关键词': 'r_detail',

    // ==================== 🟦 逻辑力 (Logic) ====================
    '错题归类与规律发现': 'l_source',
    '用"画图法"理解应用题': 'l_draft',
    '知识总结思维导图': 'l_struct',
    '作文提纲与修改': 'l_struct',
    '整理易混淆点对比表': 'l_compare',
    '总结解题模型与套路': 'l_model',
    '阅读理解策略练习': 'l_model',

    // ==================== 🟨 自主力 (Autonomy) ====================
    '帮助同学讲解': 'a_feynman',
    '用"分步法"讲解数学题': 'l_draft',
    '生字词听写': 'a_bloom',
    '单词听写与默写': 'a_bloom',
    '好词好句摘抄': 'a_hunt',
    '提出有价值的问题': 'a_ask',
    '帮助同学（讲解/拍视频/打印等）': 'a_help',
    '生活中的知识应用': 'a_life',

    // ==================== 🟩 规划力 (Planning) ====================
    '制定学习计划': 'p_helm',
    '目标设定与回顾': 'p_helm',
    '有效预习并打卡': 'p_scout',
    '自主预习': 'p_scout',
    '离校前的书包整理': 'g_streak',
    '离校前的个人卫生清理（桌面/抽屉/地面）': 'g_streak',
    '时间管理练习': 'p_tomato',
    '任务优先级排序': 'p_priority',

    // ==================== 🟧 毅力值 (Grit) ====================
    '完成一次专注力训练': 'g_zen',
    '口算限时挑战': 'g_drill',
    '书写工整': 'g_drill',
    '课外阅读30分钟': 'g_accum',
    '年级同步阅读': 'g_accum'
};

/**
 * 获取任务对应的技能ID
 */
export const getSkillCodeByTaskName = (taskName: string): string | null => {
    return TASK_SKILL_MAPPING[taskName] || null;
};
