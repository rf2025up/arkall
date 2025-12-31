// 共享配置数据管理 - 使用 localStorage 实现跨页面同步

export interface CategoryItem {
    name: string;
    items: string[];
}

// 默认核心教学法分类
const DEFAULT_METHODOLOGY_CATEGORIES: CategoryItem[] = [
    { name: '基础学习方法论', items: ['用"三色笔法"整理作业', '错题的红笔订正', '作业的自主检查', '试卷体检法', '自评当日作业质量', '错题的摘抄与归因', '记录并解决盲区问题', '书写工整'] },
    { name: '数学思维与解题策略', items: ['错题归类与规律发现', '用"画图法"理解应用题', '用"分步法"讲解数学题', '草稿纸规范使用', '一题多解练习', '整理易混淆点对比表', '总结解题模型与套路', '圈画审题关键词', '口算限时挑战'] },
    { name: '语文学科能力深化', items: ['课文朗读与背诵', '生字词听写', '阅读理解策略练习', '作文提纲与修改'] },
    { name: '英语应用与输出', items: ['单词听写与默写', '课文朗读与背诵', '口语对话练习', '听力理解训练'] },
    { name: '阅读深度与分享', items: ['阅读记录卡填写', '好词好句摘抄', '读后感分享', '阅读推荐', '课外阅读30分钟'] },
    { name: '自主学习与规划', items: ['制定学习计划', '时间管理练习', '目标设定与回顾', '自主预习', '有效预习并打卡', '任务优先级排序', '离校前的书包整理'] },
    { name: '课堂互动与深度参与', items: ['主动举手发言', '小组讨论参与', '提出有价值的问题', '帮助同学讲解'] },
    { name: '家庭联结与知识迁移', items: ['与家长分享学习内容', '生活中的知识应用', '家校沟通反馈', '家庭作业展示'] },
    { name: '高阶输出与创新', items: ['创意写作', '项目展示', '知识总结思维导图', '跨学科应用'] }
];

// 默认综合成长分类
const DEFAULT_GROWTH_CATEGORIES: CategoryItem[] = [
    { name: '阅读广度类', items: ['年级同步阅读', '课外阅读30分钟', '填写阅读记录单', '阅读一个成语故事，并积累掌握3个成语'] },
    { name: '整理与贡献类', items: ['离校前的个人卫生清理（桌面/抽屉/地面）', '离校前的书包整理', '一项集体贡献任务（浇花/整理书架/打扫等）', '吃饭时帮助维护秩序，确认光盘，地面保持干净', '为班级图书角推荐一本书，并写一句推荐语'] },
    { name: '互助与创新类', items: ['帮助同学（讲解/拍视频/打印等）', '一项创意表达任务（画画/写日记/做手工等）', '一项健康活力任务（眼保健操/拉伸/深呼吸/跳绳等）', '完成一次专注力训练'] },
    { name: '家庭联结类', items: ['与家人共读30分钟（可亲子读、兄弟姐妹读、给长辈读）', '帮家里完成一项力所及的家务（摆碗筷、倒垃圾/整理鞋柜等）'] }
];

const STORAGE_KEY_METHODOLOGY = 'arkok_methodology_categories';
const STORAGE_KEY_GROWTH = 'arkok_growth_categories';

// 获取核心教学法分类
export function getMethodologyCategories(): CategoryItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_METHODOLOGY);
        return stored ? JSON.parse(stored) : DEFAULT_METHODOLOGY_CATEGORIES;
    } catch {
        return DEFAULT_METHODOLOGY_CATEGORIES;
    }
}

// 保存核心教学法分类
export function saveMethodologyCategories(categories: CategoryItem[]): void {
    localStorage.setItem(STORAGE_KEY_METHODOLOGY, JSON.stringify(categories));
}

// 获取综合成长分类
export function getGrowthCategories(): CategoryItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_GROWTH);
        return stored ? JSON.parse(stored) : DEFAULT_GROWTH_CATEGORIES;
    } catch {
        return DEFAULT_GROWTH_CATEGORIES;
    }
}

// 保存综合成长分类
export function saveGrowthCategories(categories: CategoryItem[]): void {
    localStorage.setItem(STORAGE_KEY_GROWTH, JSON.stringify(categories));
}

// 基础过关标签（固定）
export const FIXED_QC_ITEMS = {
    chinese: ['生字听写', '课文背诵', '古诗/日积月累默写', '课文理解问答'],
    math: ['口算计时', '竖式/脱式', '概念/公式背默'],
    english: ['单词默写', '中英互译', '句型背诵', '课文背诵']
};
