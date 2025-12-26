export interface CurriculumItem {
    version: string;
    subject: string;
    grade: string;
    semester: string;
    unit: string;
    lesson: string;
    title: string;
}

/**
 * 📚 标准课程库数据索引 (2025 秋季新教材)
 * 语文：部编版 | 数学：人教版 | 英语：湘少版
 * 用于自动化进度对齐，消除老师录入课名的负担
 */
const CURRICULUM_DATA: CurriculumItem[] = [
    // ============================================================================
    // 语文 - 人教版 (2025秋)
    // ============================================================================

    // --- 语文 一年级 上册 ---
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '1', title: '天地人' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '2', title: '金木水火土' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '3', title: '口耳目' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '4', title: '日月水火' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '5', title: '对韵歌' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '2', lesson: '1', title: 'a o e' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '2', lesson: '2', title: 'i u ü y w' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '2', lesson: '3', title: 'b p m f' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '2', lesson: '4', title: 'd t n l' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '3', lesson: '1', title: 'ai ei ui' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '3', lesson: '2', title: 'ao ou iu' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '4', lesson: '1', title: '秋天' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '4', lesson: '2', title: '小小的船' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '4', lesson: '3', title: '江南' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '4', lesson: '4', title: '四季' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '5', lesson: '1', title: '画' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '5', lesson: '2', title: '大小多少' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '5', lesson: '3', title: '小书包' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '5', lesson: '4', title: '日月明' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '5', lesson: '5', title: '升国旗' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '6', lesson: '1', title: '影子' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '6', lesson: '2', title: '比尾巴' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '6', lesson: '3', title: '青蛙写诗' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '6', lesson: '4', title: '雨点儿' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '7', lesson: '1', title: '明天要远足' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '7', lesson: '2', title: '大还是小' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '7', lesson: '3', title: '项链' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '8', lesson: '1', title: '雪地里的小画家' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '8', lesson: '2', title: '乌鸦喝水' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '8', lesson: '3', title: '小蜗牛' },

    // --- 语文 二年级 上册 ---
    // --- 语文 二年级 上册 (2025新版) ---
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '1', lesson: '1', title: '小蝌蚪找妈妈' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '1', lesson: '2', title: '我是什么' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '1', lesson: '3', title: '植物妈妈有办法' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '1', lesson: '4', title: '语文园地一' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '2', lesson: '1', title: '场景歌' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '2', lesson: '2', title: '树之歌' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '2', lesson: '3', title: '拍手歌' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '2', lesson: '4', title: '田家四季歌' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '2', lesson: '5', title: '语文园地二' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '3', lesson: '1', title: '曹冲称象' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '3', lesson: '2', title: '玲玲的画' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '3', lesson: '3', title: '一封信' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '3', lesson: '4', title: '妈妈睡了' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '3', lesson: '5', title: '语文园地三' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '4', lesson: '1', title: '坐井观天' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '4', lesson: '2', title: '寒号鸟' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '4', lesson: '3', title: '我要的是葫芦' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '4', lesson: '4', title: '语文园地四' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '5', lesson: '12', title: '寒号鸟' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '5', lesson: '13', title: '我要的是葫芦' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '5', lesson: '14', title: '语文园地五' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '6', lesson: '14', title: '八角楼上' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '6', lesson: '15', title: '朱德的扁担' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '6', lesson: '16', title: '难忘的泼水节' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '6', lesson: '17', title: '刘胡兰' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '6', lesson: '18', title: '语文园地六' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '7', lesson: '18', title: '古诗二首(江雪/敕勒歌)' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '7', lesson: '19', title: '雾在哪里' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '7', lesson: '20', title: '雪孩子' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '7', lesson: '21', title: '语文园地七' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '8', lesson: '21', title: '称赞' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '8', lesson: '22', title: '纸船和风筝' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '8', lesson: '23', title: '快乐的小河' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '8', lesson: '24', title: '语文园地八' },

    // --- 语文 三年级 上册 (2025新版) ---
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '1', lesson: '1', title: '大青树下的小学' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '1', lesson: '2', title: '花的学校' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '1', lesson: '3', title: '*不懂就要问' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '1', lesson: '4', title: '语文园地一' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '2', lesson: '5', title: '古诗三首(望洞庭/山行/夜书所见)' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '2', lesson: '6', title: '铺满金色巴掌的水泥道' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '2', lesson: '7', title: '秋天的雨' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '2', lesson: '8', title: '*听听，秋的声音' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '2', lesson: '9', title: '语文园地二' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '3', lesson: '10', title: '总也倒不了的老屋' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '3', lesson: '11', title: '*犟龟' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '3', lesson: '12', title: '*小狗学叫' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '3', lesson: '13', title: '语文园地三' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '4', lesson: '14', title: '宝葫芦的秘密(节选)' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '4', lesson: '15', title: '在牛肚子里旅行' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '4', lesson: '16', title: '一块奶酪' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '4', lesson: '17', title: '快乐读书吧' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '4', lesson: '18', title: '语文园地四' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '5', lesson: '19', title: '搭船的鸟' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '5', lesson: '20', title: '金色的草地' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '5', lesson: '21', title: '习作例文(我家的小狗/我爱故乡的杨梅)' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '6', lesson: '22', title: '富饶的西沙群岛' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '6', lesson: '23', title: '海滨小城' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '6', lesson: '24', title: '美丽的小兴安岭' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '6', lesson: '25', title: '*香港，璀璨的明珠' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '6', lesson: '26', title: '语文园地六' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '7', lesson: '27', title: '古诗三首(鹿柴/望天门山/饮湖上初晴后雨)' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '7', lesson: '28', title: '大自然的声音' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '7', lesson: '29', title: '读不完的大书' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '7', lesson: '30', title: '语文园地七' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '8', lesson: '31', title: '司马光' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '8', lesson: '32', title: '一定要争气' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '8', lesson: '33', title: '手术台就是阵地' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '8', lesson: '34', title: '*一个粗瓷大碗' },
    { version: '人教版', subject: 'chinese', grade: '3', semester: '上', unit: '8', lesson: '35', title: '语文园地八' },

    // --- 语文 四年级 上册 (2025新版) ---
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '1', lesson: '1', title: '观潮' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '1', lesson: '2', title: '走月亮' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '1', lesson: '3', title: '现代诗二首(秋晚的江上/花牛歌)' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '1', lesson: '4', title: '*繁星' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '1', lesson: '5', title: '语文园地一' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '2', lesson: '6', title: '一个豆荚里的五粒豆' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '2', lesson: '7', title: '夜间飞行的秘密' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '2', lesson: '8', title: '呼风唤雨的世纪' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '2', lesson: '9', title: '*蝴蝶的家' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '2', lesson: '10', title: '语文园地二' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '3', lesson: '11', title: '古诗三首(暮江吟/题西林壁/雪梅)' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '3', lesson: '12', title: '爬山虎的脚' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '3', lesson: '13', title: '蟋蟀的住宅' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '3', lesson: '14', title: '语文园地三' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '4', lesson: '15', title: '盘古开天地' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '4', lesson: '16', title: '精卫填海' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '4', lesson: '17', title: '普罗米修斯' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '4', lesson: '18', title: '*女娲补天' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '4', lesson: '19', title: '快乐读书吧' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '4', lesson: '20', title: '语文园地四' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '5', lesson: '21', title: '麻雀' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '5', lesson: '22', title: '爬天都峰' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '5', lesson: '23', title: '习作例文(我家的杏熟了/小木船)' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '6', lesson: '24', title: '牛和鹅' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '6', lesson: '25', title: '一只窝囊的大老虎' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '6', lesson: '26', title: '陀螺' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '6', lesson: '27', title: '语文园地六' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '7', lesson: '28', title: '古诗三首(出塞/凉州词/夏日绝句)' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '7', lesson: '29', title: '为中华之崛起而读书' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '7', lesson: '30', title: '梅兰芳蓄须' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '7', lesson: '31', title: '*延安，我把你追寻' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '7', lesson: '32', title: '语文园地七' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '8', lesson: '33', title: '王戎不取道旁李' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '8', lesson: '34', title: '西门豹治邺' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '8', lesson: '35', title: '*故事二则(扁鹊治病/纪昌学射)' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '8', lesson: '36', title: '语文园地八' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '8', lesson: '25', title: '王戎不取道旁李' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '8', lesson: '26', title: '西门豹治邺' },
    { version: '人教版', subject: 'chinese', grade: '4', semester: '上', unit: '8', lesson: '27', title: '故事二则' },

    // --- 语文 五年级 上册 (2025新版) ---
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '1', lesson: '1', title: '白鹭' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '1', lesson: '2', title: '落花生' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '1', lesson: '3', title: '桂花雨' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '1', lesson: '4', title: '*珍珠鸟' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '1', lesson: '5', title: '语文园地一' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '2', lesson: '6', title: '搭石' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '2', lesson: '7', title: '将相和' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '2', lesson: '8', title: '什么比猎豹的速度更快' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '2', lesson: '9', title: '冀中的地道战' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '2', lesson: '10', title: '语文园地二' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '3', lesson: '11', title: '猎人海力布' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '3', lesson: '12', title: '牛郎织女(一)' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '3', lesson: '13', title: '*牛郎织女(二)' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '3', lesson: '14', title: '快乐读书吧' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '3', lesson: '15', title: '语文园地三' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '4', lesson: '16', title: '古诗三首(示儿/题临安邸/己亥杂诗)' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '4', lesson: '17', title: '少年中国说(节选)' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '4', lesson: '18', title: '圆明园的毁灭' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '4', lesson: '19', title: '*小岛' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '4', lesson: '20', title: '语文园地四' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '5', lesson: '21', title: '太阳' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '5', lesson: '22', title: '松鼠' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '5', lesson: '23', title: '习作例文(鲸/风向袋的制作)' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '6', lesson: '24', title: '慈母情深' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '6', lesson: '25', title: '父爱之舟' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '6', lesson: '26', title: '*“精彩极了”和“糟糕透了”' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '6', lesson: '27', title: '语文园地六' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '7', lesson: '28', title: '古诗词三首(山居秋暝/枫桥夜泊/长相思)' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '7', lesson: '29', title: '四季之美' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '7', lesson: '30', title: '鸟的天堂' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '7', lesson: '31', title: '*月迹' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '7', lesson: '32', title: '语文园地七' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '8', lesson: '33', title: '古人谈读书' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '8', lesson: '34', title: '忆读书' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '8', lesson: '35', title: '*我的“长生果”' },
    { version: '人教版', subject: 'chinese', grade: '5', semester: '上', unit: '8', lesson: '36', title: '语文园地八' },

    // --- 语文 六年级 上册 (2025新版) ---
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '1', lesson: '1', title: '草原' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '1', lesson: '2', title: '丁香结' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '1', lesson: '3', title: '古诗词三首(宿建德江/六月二十七日望湖楼醉书/西江月·夜行黄沙道中)' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '1', lesson: '4', title: '*花之歌' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '1', lesson: '5', title: '语文园地一' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '2', lesson: '6', title: '七律·长征' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '2', lesson: '7', title: '狼牙山五壮士' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '2', lesson: '8', title: '开国大典' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '2', lesson: '9', title: '*灯光' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '2', lesson: '10', title: '*我的战友邱少云' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '2', lesson: '11', title: '语文园地二' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '3', lesson: '12', title: '竹节人' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '3', lesson: '13', title: '宇宙生命之谜' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '3', lesson: '14', title: '*故宫博物院' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '3', lesson: '15', title: '语文园地三' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '4', lesson: '16', title: '桥' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '4', lesson: '17', title: '穷人' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '4', lesson: '18', title: '*金色的鱼钩' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '4', lesson: '19', title: '快乐读书吧' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '4', lesson: '20', title: '语文园地四' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '5', lesson: '21', title: '夏天里的成长' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '5', lesson: '22', title: '盼' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '5', lesson: '23', title: '习作例文(爸爸的计划/小站)' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '6', lesson: '24', title: '古诗三首(浪淘沙/江南春/书湖阴先生壁)' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '6', lesson: '25', title: '只有一个地球' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '6', lesson: '26', title: '*青山不老' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '6', lesson: '27', title: '*三黑和土地' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '6', lesson: '28', title: '语文园地六' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '7', lesson: '29', title: '文言文二则(伯牙鼓琴/书戴嵩画牛)' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '7', lesson: '30', title: '月光曲' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '7', lesson: '31', title: '*京剧趣谈' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '7', lesson: '32', title: '语文园地七' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '8', lesson: '33', title: '少年闰土' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '8', lesson: '34', title: '好的故事' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '8', lesson: '35', title: '*我的伯父鲁迅先生' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '8', lesson: '36', title: '有的人——纪念鲁迅有感' },
    { version: '人教版', subject: 'chinese', grade: '6', semester: '上', unit: '8', lesson: '37', title: '语文园地八' },

    // ============================================================================
    // 数学 - 人教版 (2025秋)
    // ============================================================================

    // --- 数学 一年级 上册 (2024/2025 新教材) ---
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '1', lesson: '1', title: '在校园里找一找' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '1', lesson: '2', title: '在操场上玩一玩' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '1', lesson: '3', title: '在教室里认一认' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '2', lesson: '1', title: '1～5的认识' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '2', lesson: '2', title: '比大小' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '2', lesson: '3', title: '第几' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '2', lesson: '4', title: '分与合' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '2', lesson: '5', title: '5以内的加法' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '2', lesson: '6', title: '5以内的减法' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '2', lesson: '7', title: '0的认识和加减法' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '3', lesson: '1', title: '6～9的认识' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '3', lesson: '2', title: '6和7的加减法' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '3', lesson: '3', title: '8和9的加减法' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '3', lesson: '4', title: '10的认识和加减法' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '3', lesson: '5', title: '连加连减' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '4', lesson: '1', title: '认识立体图形' },
    { version: '人教版', subject: 'math', grade: '1', semester: '上', unit: '4', lesson: '2', title: '立体图形解决问题' },


    // --- 数学 二年级 上册 (2025新教材) ---
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '1', lesson: '1', title: '分类与整理' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '2', lesson: '1', title: '乘法的初步认识' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '2', lesson: '2', title: '2～6的乘法口诀' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '2', lesson: '3', title: '整理和复习' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '3', lesson: '1', title: '除法的初步认识' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '3', lesson: '2', title: '用2～6的乘法口诀求商' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '3', lesson: '3', title: '整理和复习' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '3', lesson: '4', title: '综合与实践：校园小导游' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '4', lesson: '1', title: '厘米和米' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '4', lesson: '2', title: '整理和复习' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '4', lesson: '3', title: '综合与实践：身体上的尺子' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '5', lesson: '1', title: '7～9的乘法口诀' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '5', lesson: '2', title: '用7～9的乘法口诀求商' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '5', lesson: '3', title: '整理和复习' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '6', lesson: '1', title: '整理复习：数与运算' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '6', lesson: '2', title: '整理复习：图形的位置与测量' },
    { version: '人教版', subject: 'math', grade: '2', semester: '上', unit: '6', lesson: '3', title: '整理复习：应用提升' },


    // --- 数学 三年级 上册 (2025新版) ---
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '1', lesson: '1', title: '观察物体' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '2', lesson: '1', title: '混合运算' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '3', lesson: '1', title: '毫米、分米的认识' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '3', lesson: '2', title: '千米的认识' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '3', lesson: '3', title: '☆ 曹冲称象的故事' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '3', lesson: '4', title: '综合与实践：认识质量单位' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '3', lesson: '5', title: '称重我很行/称重挑战/小讲堂' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '4', lesson: '1', title: '多位数乘一位数(口算/笔算/数字编码)' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '4', lesson: '2', title: '综合与实践：编制学号' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '5', lesson: '1', title: '线和角(线段/射线/直线/角)' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '6', lesson: '1', title: '分数的初步认识(几分之一/几分之几/简单计算)' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '6', lesson: '2', title: '3. 进一步认识分数/整理和复习' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '7', lesson: '1', title: '总复习(数与运算)' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '7', lesson: '2', title: '总复习(数量关系)' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '7', lesson: '3', title: '总复习(图形与几何)' },
    { version: '人教版', subject: 'math', grade: '3', semester: '上', unit: '7', lesson: '4', title: '总复习(综合练习)' },

    // --- 数学 四年级 上册 (2025新版) ---
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '1', lesson: '1', title: '大数的认识' },
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '1', lesson: '2', title: '1亿有多大' },
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '2', lesson: '1', title: '公顷和平方千米' },
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '3', lesson: '1', title: '角的度量' },
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '4', lesson: '1', title: '三位数乘两位数' },
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '5', lesson: '1', title: '平行四边形和梯形' },
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '6', lesson: '1', title: '除数是两位数的除法' },
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '7', lesson: '1', title: '条形统计图' },
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '8', lesson: '1', title: '数学广角──优化' },
    { version: '人教版', subject: 'math', grade: '4', semester: '上', unit: '9', lesson: '1', title: '总复习' },

    // --- 数学 五年级 上册 (2025新版) ---
    { version: '人教版', subject: 'math', grade: '5', semester: '上', unit: '1', lesson: '1', title: '小数乘法' },
    { version: '人教版', subject: 'math', grade: '5', semester: '上', unit: '2', lesson: '1', title: '位置' },
    { version: '人教版', subject: 'math', grade: '5', semester: '上', unit: '3', lesson: '1', title: '小数除法' },
    { version: '人教版', subject: 'math', grade: '5', semester: '上', unit: '4', lesson: '1', title: '可能性' },
    { version: '人教版', subject: 'math', grade: '5', semester: '上', unit: '4', lesson: '2', title: '综合与实践：掷一掷' },
    { version: '人教版', subject: 'math', grade: '5', semester: '上', unit: '5', lesson: '1', title: '简易方程' },
    { version: '人教版', subject: 'math', grade: '5', semester: '上', unit: '6', lesson: '1', title: '多边形的面积' },
    { version: '人教版', subject: 'math', grade: '5', semester: '上', unit: '7', lesson: '1', title: '数学广角──植树问题' },
    { version: '人教版', subject: 'math', grade: '5', semester: '上', unit: '8', lesson: '1', title: '总复习' },

    // --- 数学 六年级 上册 (2025新版) ---
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '1', lesson: '1', title: '分数乘法' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '2', lesson: '1', title: '位置与方向(二)' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '3', lesson: '1', title: '分数除法' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '4', lesson: '1', title: '比' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '5', lesson: '1', title: '圆' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '5', lesson: '2', title: '综合与实践：确定起跑线' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '6', lesson: '1', title: '百分数(一)' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '7', lesson: '1', title: '扇形统计图' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '7', lesson: '2', title: '综合与实践：节约用水' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '8', lesson: '1', title: '数学广角──数与形' },
    { version: '人教版', subject: 'math', grade: '6', semester: '上', unit: '9', lesson: '1', title: '总复习' },

    // ============================================================================
    // 英语 - 湘少版 (2025秋)
    // ============================================================================

    // --- 英语 三年级 上册 (湘少版) ---
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '1', lesson: '', title: 'Hello!' },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '2', lesson: '', title: "What's your name?" },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '3', lesson: '', title: 'How old are you?' },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '4', lesson: '', title: 'This is my mum.' },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '5', lesson: '', title: 'Is this your pen?' },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '6', lesson: '', title: 'Who is he?' },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '7', lesson: '', title: 'What colour is it?' },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '8', lesson: '', title: "What's this?" },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '9', lesson: '', title: "It's a lion." },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '10', lesson: '', title: 'Happy birthday!' },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '11', lesson: '', title: 'Merry Christmas!' },
    { version: '湘少版', subject: 'english', grade: '3', semester: '上', unit: '12', lesson: '', title: 'Happy New Year!' },

    // --- 英语 四年级 上册 (湘少版) ---
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '1', lesson: '', title: 'Nice to meet you.' },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '2', lesson: '', title: "I'm Liu Xing." },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '3', lesson: '', title: 'Look at this photo.' },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '4', lesson: '', title: 'My classroom is nice.' },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '5', lesson: '', title: 'I like noodles.' },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '6', lesson: '', title: 'Turn right.' },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '7', lesson: '', title: 'Whose is it?' },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '8', lesson: '', title: "I like PE." },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '9', lesson: '', title: "It's one hundred." },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '10', lesson: '', title: 'Welcome to our home.' },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '11', lesson: '', title: "Where's the cat?" },
    { version: '湘少版', subject: 'english', grade: '4', semester: '上', unit: '12', lesson: '', title: "Peter can jump high." },

    // --- 英语 五年级 上册 (湘少版) ---
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '1', lesson: '', title: 'What does she look like?' },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '2', lesson: '', title: "I'd like a hamburger." },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '3', lesson: '', title: 'Do you want some rice?' },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '4', lesson: '', title: 'Can I use your pencil?' },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '5', lesson: '', title: 'Can I have a pet?' },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '6', lesson: '', title: "What's wrong with you?" },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '7', lesson: '', title: 'What time do you get up?' },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '8', lesson: '', title: 'Do you have a ruler?' },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '9', lesson: '', title: 'Whose is this?' },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '10', lesson: '', title: 'Where were you?' },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '11', lesson: '', title: "What's the weather like?" },
    { version: '湘少版', subject: 'english', grade: '5', semester: '上', unit: '12', lesson: '', title: 'I can swim very fast.' },

    // --- 英语 六年级 上册 (湘少版) ---
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '1', lesson: '', title: 'What did you do during the holidays?' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '2', lesson: '', title: 'Katie always gets up early.' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '3', lesson: '', title: 'I like my computer.' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '4', lesson: '', title: 'The Mid-Autumn Festival is coming.' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '5', lesson: '', title: 'It will be sunny and cool.' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '6', lesson: '', title: 'I will bring a big bottle.' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '7', lesson: '', title: 'What can I do?' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '8', lesson: '', title: "We shouldn't waste water." },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '9', lesson: '', title: 'This bird is bigger than the first one.' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '10', lesson: '', title: 'I don\'t feel well today.' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '11', lesson: '', title: 'Shall we go to the theatre?' },
    { version: '湘少版', subject: 'english', grade: '6', semester: '上', unit: '12', lesson: '', title: "It's Christmas again." },
];

export class CurriculumService {
    /**
     * 智能匹配课文数据 (含教学设计)
     */
    static getLessonData(params: {
        subject: string;
        unit: string | number;
        lesson?: string | number;
        version?: string;
        grade?: string;
        semester?: string;
    }): CurriculumItem | null {
        const { subject, unit, lesson = '1', version, grade = '2', semester = '上' } = params;
        const normGrade = this.getNormGrade(grade);

        // 根据学科自动选择版本 - 语文数学都是人教版，英语是湘少版
        const autoVersion = version || (subject === 'english' ? '湘少版' : '人教版');

        return CURRICULUM_DATA.find(item =>
            item.subject === subject &&
            String(item.unit) === String(unit) &&
            (String(item.lesson) === String(lesson) || !item.lesson) &&
            item.version === autoVersion &&
            item.grade === String(normGrade) &&
            item.semester === semester
        ) || null;
    }

    /**
     * 获取完整学期大纲图谱
     */
    static getSyllabus(params: {
        subject: string;
        version?: string;
        grade?: string;
        semester?: string;
    }): CurriculumItem[] {
        const { subject, version, grade = '2', semester = '上' } = params;
        const normGrade = this.getNormGrade(grade);

        // 根据学科自动选择版本 - 语文数学都是人教版，英语是湘少版
        const autoVersion = version || (subject === 'english' ? '湘少版' : '人教版');

        return CURRICULUM_DATA.filter(item =>
            item.subject === subject &&
            item.version === autoVersion &&
            item.grade === String(normGrade) &&
            item.semester === semester
        ).sort((a, b) => {
            const unitA = parseInt(a.unit);
            const unitB = parseInt(b.unit);
            if (unitA !== unitB) return unitA - unitB;
            return parseInt(a.lesson || '0') - parseInt(b.lesson || '0');
        });
    }

    /**
     * 获取课程数量统计
     */
    static getStats(): { subject: string; grade: string; semester: string; count: number }[] {
        const stats: Map<string, number> = new Map();
        CURRICULUM_DATA.forEach(item => {
            const key = `${item.subject}_${item.grade}_${item.semester}`;
            stats.set(key, (stats.get(key) || 0) + 1);
        });
        return Array.from(stats.entries()).map(([key, count]) => {
            const [subject, grade, semester] = key.split('_');
            return { subject, grade, semester, count };
        });
    }

    /**
     * 保持兼容性的老接口
     */
    static getTitle(params: any): string | null {
        const data = this.getLessonData(params);
        return data ? data.title : null;
    }

    /**
     * 将中文年级名映射为数字索引 (例如："一年级" -> "1")
     */
    private static getNormGrade(grade: string): string {
        const gradeMap: Record<string, string> = {
            '一年级': '1',
            '二年级': '2',
            '三年级': '3',
            '四年级': '4',
            '五年级': '5',
            '六年级': '6',
            '1': '1',
            '2': '2',
            '3': '3',
            '4': '4',
            '5': '5',
            '6': '6'
        };
        return gradeMap[grade] || grade;
    }
}

export default CurriculumService;
