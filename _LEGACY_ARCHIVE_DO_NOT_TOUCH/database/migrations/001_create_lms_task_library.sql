-- 文件: database/migrations/001_create_lms_task_library.sql
-- 目的: 创建任务库表并插入11大类初始数据
-- 执行时间: 2025-12-11

CREATE TABLE IF NOT EXISTS lms_task_library (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  default_exp INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入11大类任务库初始数据
INSERT INTO lms_task_library (category, name, default_exp, sort_order) VALUES
-- 基础学习(核心)
('一、基础学习(核心)', '完成数学书面作业', 15, 1),
('一、基础学习(核心)', '完成语文书面作业', 15, 2),
('一、基础学习(核心)', '完成英语书面作业', 15, 3),
('一、基础学习(核心)', '作业的自主检查', 10, 4),
('一、基础学习(核心)', '错题的红笔订正', 12, 5),
('一、基础学习(核心)', '错题的摘抄与归因', 10, 6),
('一、基础学习(核心)', '用三色笔法整理作业', 15, 7),
('一、基础学习(核心)', '自评当日作业质量(1-5星)', 5, 8),

-- 数学巩固
('二、数学巩固', '100道口算练习', 20, 9),
('二、数学巩固', '5道旧错题(1星)的重做', 25, 10),
('二、数学巩固', '一项老师定制的数学拓展', 30, 11),
('二、数学巩固', '一道说题练习(讲思路)', 20, 12),
('二、数学巩固', '找一道生活中的数学问题', 25, 13),
('二、数学巩固', '高阶：找1类母题', 35, 14),
('二、数学巩固', '高阶：主动重做昨天错题', 25, 15),
('二、数学巩固', '高阶：用解题模型独立练题', 30, 16),

-- 语文巩固
('三、语文巩固', '生字/词语的听写练习', 15, 17),
('三、语文巩固', '听写错字的补写(3遍)', 10, 18),
('三、语文巩固', '一组看拼音写词语', 15, 19),
('三、语文巩固', '课文重点知识的问答过关', 20, 20),
('三、语文巩固', '课文填空与阅读背诵', 20, 21),
('三、语文巩固', '课内阅读理解/古诗默写', 25, 22),
('三、语文巩固', '仿写课文中的一个好句', 15, 23),
('三、语文巩固', '为生字编顺口溜或小故事', 20, 24),
('三、语文巩固', '运用一种阅读理解模板', 15, 25),

-- 语文拓展
('四、语文拓展', '查字典/认部首/圈释义', 10, 26),
('四、语文拓展', '组一组·辨一辨(形近字)', 12, 27),
('四、语文拓展', '想一想·记一记(成语接龙)', 15, 28),

-- 英语巩固
('五、英语巩固', '单词的默写练习', 15, 29),
('五、英语巩固', '课文的朗读练习(10分钟)', 12, 30),
('五、英语巩固', '用今日单词编3句小对话', 18, 31),
('五、英语巩固', '制作一张单词卡', 10, 32),

-- 阅读任务
('六、阅读任务', '年级同步阅读', 20, 33),
('六、阅读任务', '课外阅读30分钟', 15, 34),
('六、阅读任务', '填写阅读记录单', 10, 35),
('六、阅读任务', '摘抄好词金句并简述', 15, 36),
('六、阅读任务', '画人物关系图或预测情节', 18, 37),
('六、阅读任务', '录制阅读小分享', 20, 38),
('六、阅读任务', '阅读成语故事并造句', 15, 39),

-- 自主规划
('七、自主规划', '自主规划复习任务', 10, 40),
('七、自主规划', '自主规划预习任务', 10, 41),
('七、自主规划', '制定一个学习小计划', 15, 42),
('七、自主规划', '设定改进目标并打卡', 12, 43),

-- 整理与贡献
('八、整理与贡献', '离校前的个人卫生清理', 8, 44),
('八、整理与贡献', '离校前的书包整理', 8, 45),
('八、整理与贡献', '集体贡献任务(浇花等)', 10, 46),
('八、整理与贡献', '光盘行动，维护秩序', 8, 47),
('八、整理与贡献', '推荐一本书并写推荐语', 15, 48),

-- 互助与创新
('九、互助与创新', '帮助同学(讲解/打印)', 12, 49),
('九、互助与创新', '创意表达(画画/手工)', 15, 50),
('九、互助与创新', '健康活力任务(运动)', 10, 51),
('九、互助与创新', '录制小老师讲题视频', 20, 52),

-- 课堂成长
('十、课堂成长', '课堂举手回答1次问题', 8, 53),
('十、课堂成长', '准备1个思考的问题', 5, 54),
('十、课堂成长', '申请板演/领读/汇报', 10, 55),
('十、课堂成长', '记录老师的金句', 8, 56),
('十、课堂成长', '帮同桌理解知识点', 12, 57),

-- 家庭联结
('十一、家庭联结', '与家人共读30分钟', 15, 58),
('十一、家庭联结', '向家长讲解学习方法', 12, 59),
('十一、家庭联结', '帮家里做一项家务', 10, 60),
('十一、家庭联结', '教家人新词/成语/句子', 15, 61),
('十一、家庭联结', '复习基础知识给爸妈看', 12, 62),
('十一、家庭联结', '分享改进目标情况', 10, 63),
('十一、家庭联结', '用数学解决家庭问题', 20, 64);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_lms_task_library_category ON lms_task_library(category);
CREATE INDEX IF NOT EXISTS idx_lms_task_library_active ON lms_task_library(is_active);
CREATE INDEX IF NOT EXISTS idx_lms_task_library_sort_order ON lms_task_library(sort_order);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lms_task_library_updated_at
    BEFORE UPDATE ON lms_task_library
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE lms_task_library IS '任务库表：存储11大类学习任务';
COMMENT ON COLUMN lms_task_library.category IS '任务类别：如"一、基础学习(核心)"';
COMMENT ON COLUMN lms_task_library.name IS '任务名称：如"完成数学书面作业"';
COMMENT ON COLUMN lms_task_library.default_exp IS '默认经验值：完成任务获得的基础经验';
COMMENT ON COLUMN lms_task_library.is_active IS '是否启用：控制任务是否在前端显示';
COMMENT ON COLUMN lms_task_library.sort_order IS '排序顺序：用于前端显示顺序';