-- ArkOK V2 任务库分类更新脚本
-- 根据最终9大标签分类标准更新所有任务的运营标签

-- 清理现有数据，确保分类准确
TRUNCATE TABLE task_library RESTART IDENTITY;

-- 1. 基础作业
INSERT INTO task_library (name, category, educationalDomain, educationalSubcategory, defaultExp, type, difficulty, isActive, description) VALUES
('完成数学书面作业', '基础作业', '基础作业', '数学作业', 5, 'TASK', 2, true, '完成数学书面作业'),
('完成语文书面作业', '基础作业', '基础作业', '语文作业', 5, 'TASK', 2, true, '完成语文书面作业'),
('完成英语书面作业', '基础作业', '基础作业', '英语作业', 5, 'TASK', 2, true, '完成英语书面作业'),
('作业的自主检查', '基础作业', '核心教学法', '基础学习方法论', 10, 'TASK', 2, true, '作业的自主检查'),
('错题的红笔订正', '基础作业', '核心教学法', '基础学习方法论', 10, 'TASK', 2, true, '错题的红笔订正'),
('错题的摘抄与归因', '基础作业', '核心教学法', '基础学习方法论', 15, 'TASK', 3, true, '错题的摘抄与归因');

-- 2. 语文
INSERT INTO task_library (name, category, educationalDomain, educationalSubcategory, defaultExp, type, difficulty, isActive, description) VALUES
('生字/词语的听写练习', '语文', '核心教学法', '语文学科能力深化', 10, 'TASK', 2, true, '生字/词语的听写练习'),
('听写错字的补写练习', '语文', '核心教学法', '语文学科能力深化', 15, 'TASK', 3, true, '听写错字的补写练习'),
('一组"看拼音写词语"与"给生字注音"练习', '语文', '核心教学法', '语文学科能力深化', 10, 'TASK', 2, true, '拼音与生字练习'),
('课文重点知识的问答过关', '语文', '核心教学法', '语文学科能力深化', 20, 'QC', 3, true, '课文重点知识的问答过关'),
('课文填空/古诗的背诵练习', '语文', '核心教学法', '语文学科能力深化', 20, 'QC', 3, true, '课文填空/古诗背诵'),
('课文填空/古诗的默写练习', '语文', '核心教学法', '语文学科能力深化', 20, 'QC', 3, true, '课文填空/古诗默写'),
('仿写课文中的一个好句', '语文', '核心教学法', '语文学科能力深化', 30, 'TASK', 3, true, '仿写课文好句'),
('为当天生字编一句顺口溜或小故事', '语文', '核心教学法', '语文学科能力深化', 20, 'TASK', 3, true, '生字顺口溜创作'),
('查一查·读一读：查字典', '语文', '核心教学法', '语文学科能力深化', 20, 'TASK', 2, true, '查字典练习'),
('组一组·辨一辨：分类组词', '语文', '核心教学法', '语文学科能力深化', 25, 'TASK', 3, true, '分类组词练习');

-- 3. 数学
INSERT INTO task_library (name, category, educationalDomain, educationalSubcategory, defaultExp, type, difficulty, isActive, description) VALUES
('100道口算练习', '数学', '核心教学法', '数学思维与解题策略', 10, 'TASK', 2, true, '100道口算练习'),
('5道旧错题（1星）的重做练习', '数学', '核心教学法', '数学思维与解题策略', 20, 'TASK', 2, true, '旧错题重做'),
('一项老师定制的数学拓展任务', '数学', '核心教学法', '数学思维与解题策略', 20, 'TASK', 3, true, '数学拓展任务'),
('找一道生活中的数学问题并尝试解决', '数学', '核心教学法', '数学思维与解题策略', 20, 'TASK', 3, true, '生活数学问题');

-- 4. 英语
INSERT INTO task_library (name, category, educationalDomain, educationalSubcategory, defaultExp, type, difficulty, isActive, description) VALUES
('单词的默写练习', '英语', '核心教学法', '英语应用与输出', 15, 'TASK', 2, true, '单词默写'),
('课文的朗读练习（10分钟）', '英语', '核心教学法', '英语应用与输出', 10, 'TASK', 1, true, '课文朗读'),
('用今日单词编一个3句话的小对话', '英语', '核心教学法', '英语应用与输出', 25, 'TASK', 3, true, '单词对话'),
('制作一张单词卡', '英语', '核心教学法', '英语应用与输出', 30, 'TASK', 3, true, '制作单词卡');

-- 5. 阅读
INSERT INTO task_library (name, category, educationalDomain, educationalSubcategory, defaultExp, type, difficulty, isActive, description) VALUES
('年级同步阅读', '阅读', '综合成长', '阅读', 15, 'TASK', 2, true, '年级同步阅读'),
('课外阅读30分钟', '阅读', '综合成长', '阅读', 25, 'TASK', 2, true, '课外阅读'),
('填写阅读记录单', '阅读', '综合成长', '阅读', 15, 'TASK', 1, true, '阅读记录单'),
('摘抄3个好词和1个金句，并简单说说"为什么好"', '阅读', '核心教学法', '阅读深度与分享', 30, 'TASK', 3, true, '好词金句赏析'),
('为所读内容画人物关系图或预测后续情节', '阅读', '核心教学法', '阅读深度与分享', 25, 'TASK', 3, true, '阅读分析'),
('录制一个1-2分钟的"阅读小分享"', '阅读', '核心教学法', '阅读深度与分享', 35, 'TASK', 3, true, '阅读分享'),
('阅读一个成语故事，并积累掌握3个成语', '阅读', '综合成长', '阅读', 30, 'TASK', 2, true, '成语阅读');

-- 6. 自主性
INSERT INTO task_library (name, category, educationalDomain, educationalSubcategory, defaultExp, type, difficulty, isActive, description) VALUES
('自主规划并完成一项"复习"任务', '自主性', '核心教学法', '自主学习与规划', 20, 'TASK', 3, true, '自主复习'),
('自主规划并完成一项"预习"任务', '自主性', '核心教学法', '自主学习与规划', 20, 'TASK', 3, true, '自主预习'),
('为明天/本周制定一个学习小计划', '自主性', '核心教学法', '自主学习与规划', 20, 'TASK', 3, true, '学习计划'),
('设定一个自己的改进目标，并打卡完成', '自主性', '核心教学法', '自主学习与规划', 50, 'TASK', 4, true, '改进目标'),
('今天在课堂上至少举手回答1次问题', '自主性', '核心教学法', '课堂互动与深度参与', 30, 'TASK', 3, true, '举手回答'),
('每节课准备1个有思考的问题，课后请教老师', '自主性', '核心教学法', '课堂互动与深度参与', 35, 'TASK', 3, true, '课堂提问');

-- 7. 特色教学
INSERT INTO task_library (name, category, educationalDomain, educationalSubcategory, defaultExp, type, difficulty, isActive, description) VALUES
('用"三色笔法"整理作业', '特色教学', '核心教学法', '基础学习方法论', 10, 'TASK', 2, true, '三色笔法'),
('自评当日作业质量并简写理由', '特色教学', '核心教学法', '基础学习方法论', 10, 'TASK', 2, true, '作业自评'),
('一道"说题"练习：口头讲解解题思路', '特色教学', '核心教学法', '数学思维与解题策略', 30, 'TASK', 4, true, '说题练习'),
('高阶任务：从课本和所有练习中找出1类"母题"', '特色教学', '核心教学法', '数学思维与解题策略', 100, 'TASK', 5, true, '母题归纳'),
('高阶任务：主动重做一遍昨天的错题', '特色教学', '核心教学法', '数学思维与解题策略', 100, 'TASK', 5, true, '错题主动重做'),
('高阶任务：用解题模型表，完整独立练习一道难题', '特色教学', '核心教学法', '数学思维与解题策略', 50, 'TASK', 4, true, '解题模型'),
('学习并运用一种阅读理解解题模板', '特色教学', '核心教学法', '语文学科能力深化', 30, 'TASK', 3, true, '阅读理解模板'),
('想一想·记一记：通过偏旁联想深度记忆', '特色教学', '核心教学法', '语文学科能力深化', 30, 'TASK', 3, true, '联想记忆'),
('记录老师今天讲的1个"金句"或方法', '特色教学', '核心教学法', '课堂互动与深度参与', 30, 'TASK', 3, true, '记录金句'),
('录制一个60秒"小老师"视频', '特色教学', '核心教学法', '高阶输出与创新', 50, 'TASK', 4, true, '小老师视频'),
('向家长讲解1个今天在托管学到的学习方法', '特色教学', '核心教学法', '家庭联结与知识迁移', 50, 'TASK', 4, true, '家长讲解');

-- 8. 学校
INSERT INTO task_library (name, category, educationalDomain, educationalSubcategory, defaultExp, type, difficulty, isActive, description) VALUES
('一项集体贡献任务（浇花/整理书架/打扫等）', '学校', '综合成长', '责任感', 15, 'TASK', 1, true, '集体贡献'),
('为班级图书角推荐一本书，并写一句推荐语', '学校', '综合成长', '责任感', 10, 'TASK', 2, true, '图书推荐'),
('帮助同学（讲解/拍视频/打印等）', '学校', '综合成长', '协作与创造', 10, 'TASK', 2, true, '帮助同学'),
('主动申请一次板演/领读/小组汇报等课堂角色', '学校', '核心教学法', '课堂互动与深度参与', 35, 'TASK', 3, true, '课堂角色'),
('帮助同桌理解一个课堂没听懂的知识点', '学校', '核心教学法', '课堂互动与深度参与', 30, 'TASK', 3, true, '帮助同桌'),
('一项创意表达任务（画画/写日记/做手工等）', '学校', '综合成长', '协作与创造', 15, 'TASK', 2, true, '创意表达'),
('一项健康活力任务（眼保健操/拉伸/深呼吸/跳绳等）', '学校', '综合成长', '责任感', 20, 'TASK', 1, true, '健康活力'),
('离校前的个人卫生清理（桌面/抽屉/地面）', '学校', '综合成长', '责任感', 20, 'TASK', 1, true, '个人卫生'),
('离校前的书包整理', '学校', '综合成长', '责任感', 20, 'TASK', 1, true, '书包整理'),
('吃饭时帮助维护秩序，确认光盘，地面保持干净', '学校', '综合成长', '责任感', 20, 'TASK', 1, true, '维护秩序');

-- 9. 家庭
INSERT INTO task_library (name, category, educationalDomain, educationalSubcategory, defaultExp, type, difficulty, isActive, description) VALUES
('与家人共读30分钟', '家庭', '综合成长', '家庭联结', 40, 'TASK', 2, true, '家庭共读'),
('帮家里完成一项力所能及的家务', '家庭', '综合成长', '家庭联结', 40, 'TASK', 1, true, '家庭家务'),
('教家人一个今天学的新词/成语/英语句子', '家庭', '核心教学法', '家庭联结与知识迁移', 50, 'TASK', 3, true, '教家人新知'),
('复习本周所有基础知识...主动给爸妈看', '家庭', '核心教学法', '家庭联结与知识迁移', 100, 'TASK', 4, true, '展示复习成果'),
('和父母分享今天的"改进目标"完成情况', '家庭', '核心教学法', '家庭联结与知识迁移', 100, 'TASK', 4, true, '分享改进目标'),
('用数学知识解决一个家庭小问题', '家庭', '核心教学法', '家庭联结与知识迁移', 30, 'TASK', 2, true, '家庭数学问题');

-- 输出统计信息
SELECT
    category as "运营标签",
    COUNT(*) as "任务数量",
    SUM(defaultExp) as "总经验值"
FROM task_library
GROUP BY category
ORDER BY
    CASE category
        WHEN '基础作业' THEN 1
        WHEN '语文' THEN 2
        WHEN '数学' THEN 3
        WHEN '英语' THEN 4
        WHEN '阅读' THEN 5
        WHEN '自主性' THEN 6
        WHEN '特色教学' THEN 7
        WHEN '学校' THEN 8
        WHEN '家庭' THEN 9
        ELSE 10
    END;