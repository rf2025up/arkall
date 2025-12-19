import { PrismaClient, TaskType } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTaskCategories() {
  try {
    console.log('🔄 清理现有任务库数据...');
    await prisma.taskLibrary.deleteMany({});
    console.log('✅ 已清空任务库');

    console.log('📚 重新按照9大标签分类标准创建任务...');

    const tasks = [
      // 1. 基础作业
      { name: '完成数学书面作业', category: '基础作业', educationalDomain: '基础作业', educationalSubcategory: '数学作业', defaultExp: 5, type: TaskType.TASK, difficulty: 2, description: '完成数学书面作业' },
      { name: '完成语文书面作业', category: '基础作业', educationalDomain: '基础作业', educationalSubcategory: '语文作业', defaultExp: 5, type: 'TASK', difficulty: 2, description: '完成语文书面作业' },
      { name: '完成英语书面作业', category: '基础作业', educationalDomain: '基础作业', educationalSubcategory: '英语作业', defaultExp: 5, type: 'TASK', difficulty: 2, description: '完成英语书面作业' },
      { name: '作业的自主检查', category: '基础作业', educationalDomain: '核心教学法', educationalSubcategory: '基础学习方法论', defaultExp: 10, type: 'TASK', difficulty: 2, description: '作业的自主检查' },
      { name: '错题的红笔订正', category: '基础作业', educationalDomain: '核心教学法', educationalSubcategory: '基础学习方法论', defaultExp: 10, type: 'TASK', difficulty: 2, description: '错题的红笔订正' },
      { name: '错题的摘抄与归因', category: '基础作业', educationalDomain: '核心教学法', educationalSubcategory: '基础学习方法论', defaultExp: 15, type: 'TASK', difficulty: 3, description: '错题的摘抄与归因' },

      // 2. 语文
      { name: '生字/词语的听写练习', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 10, type: 'TASK', difficulty: 2, description: '生字/词语的听写练习' },
      { name: '听写错字的补写练习', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 15, type: 'TASK', difficulty: 3, description: '听写错字的补写练习' },
      { name: '一组"看拼音写词语"与"给生字注音"练习', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 10, type: 'TASK', difficulty: 2, description: '拼音与生字练习' },
      { name: '课文重点知识的问答过关', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 20, type: 'QC', difficulty: 3, description: '课文重点知识的问答过关' },
      { name: '课文填空/古诗的背诵练习', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 20, type: 'QC', difficulty: 3, description: '课文填空/古诗背诵' },
      { name: '课文填空/古诗的默写练习', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 20, type: 'QC', difficulty: 3, description: '课文填空/古诗默写' },
      { name: '仿写课文中的一个好句', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 30, type: 'TASK', difficulty: 3, description: '仿写课文好句' },
      { name: '为当天生字编一句顺口溜或小故事', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 20, type: 'TASK', difficulty: 3, description: '生字顺口溜创作' },
      { name: '查一查·读一读：查字典', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 20, type: 'TASK', difficulty: 2, description: '查字典练习' },
      { name: '组一组·辨一辨：分类组词', category: '语文', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 25, type: 'TASK', difficulty: 3, description: '分类组词练习' },

      // 3. 数学
      { name: '100道口算练习', category: '数学', educationalDomain: '核心教学法', educationalSubcategory: '数学思维与解题策略', defaultExp: 10, type: 'TASK', difficulty: 2, description: '100道口算练习' },
      { name: '5道旧错题（1星）的重做练习', category: '数学', educationalDomain: '核心教学法', educationalSubcategory: '数学思维与解题策略', defaultExp: 20, type: 'TASK', difficulty: 2, description: '旧错题重做' },
      { name: '一项老师定制的数学拓展任务', category: '数学', educationalDomain: '核心教学法', educationalSubcategory: '数学思维与解题策略', defaultExp: 20, type: 'TASK', difficulty: 3, description: '数学拓展任务' },
      { name: '找一道生活中的数学问题并尝试解决', category: '数学', educationalDomain: '核心教学法', educationalSubcategory: '数学思维与解题策略', defaultExp: 20, type: 'TASK', difficulty: 3, description: '生活数学问题' },

      // 4. 英语
      { name: '单词的默写练习', category: '英语', educationalDomain: '核心教学法', educationalSubcategory: '英语应用与输出', defaultExp: 15, type: 'TASK', difficulty: 2, description: '单词默写' },
      { name: '课文的朗读练习（10分钟）', category: '英语', educationalDomain: '核心教学法', educationalSubcategory: '英语应用与输出', defaultExp: 10, type: 'TASK', difficulty: 1, description: '课文朗读' },
      { name: '用今日单词编一个3句话的小对话', category: '英语', educationalDomain: '核心教学法', educationalSubcategory: '英语应用与输出', defaultExp: 25, type: 'TASK', difficulty: 3, description: '单词对话' },
      { name: '制作一张单词卡', category: '英语', educationalDomain: '核心教学法', educationalSubcategory: '英语应用与输出', defaultExp: 30, type: 'TASK', difficulty: 3, description: '制作单词卡' },

      // 5. 阅读
      { name: '年级同步阅读', category: '阅读', educationalDomain: '综合成长', educationalSubcategory: '阅读', defaultExp: 15, type: 'TASK', difficulty: 2, description: '年级同步阅读' },
      { name: '课外阅读30分钟', category: '阅读', educationalDomain: '综合成长', educationalSubcategory: '阅读', defaultExp: 25, type: 'TASK', difficulty: 2, description: '课外阅读' },
      { name: '填写阅读记录单', category: '阅读', educationalDomain: '综合成长', educationalSubcategory: '阅读', defaultExp: 15, type: 'TASK', difficulty: 1, description: '阅读记录单' },
      { name: '摘抄3个好词和1个金句，并简单说说"为什么好"', category: '阅读', educationalDomain: '核心教学法', educationalSubcategory: '阅读深度与分享', defaultExp: 30, type: 'TASK', difficulty: 3, description: '好词金句赏析' },
      { name: '为所读内容画人物关系图或预测后续情节', category: '阅读', educationalDomain: '核心教学法', educationalSubcategory: '阅读深度与分享', defaultExp: 25, type: 'TASK', difficulty: 3, description: '阅读分析' },
      { name: '录制一个1-2分钟的"阅读小分享"', category: '阅读', educationalDomain: '核心教学法', educationalSubcategory: '阅读深度与分享', defaultExp: 35, type: 'TASK', difficulty: 3, description: '阅读分享' },
      { name: '阅读一个成语故事，并积累掌握3个成语', category: '阅读', educationalDomain: '综合成长', educationalSubcategory: '阅读', defaultExp: 30, type: 'TASK', difficulty: 2, description: '成语阅读' },

      // 6. 自主性
      { name: '自主规划并完成一项"复习"任务', category: '自主性', educationalDomain: '核心教学法', educationalSubcategory: '自主学习与规划', defaultExp: 20, type: 'TASK', difficulty: 3, description: '自主复习' },
      { name: '自主规划并完成一项"预习"任务', category: '自主性', educationalDomain: '核心教学法', educationalSubcategory: '自主学习与规划', defaultExp: 20, type: 'TASK', difficulty: 3, description: '自主预习' },
      { name: '为明天/本周制定一个学习小计划', category: '自主性', educationalDomain: '核心教学法', educationalSubcategory: '自主学习与规划', defaultExp: 20, type: 'TASK', difficulty: 3, description: '学习计划' },
      { name: '设定一个自己的改进目标，并打卡完成', category: '自主性', educationalDomain: '核心教学法', educationalSubcategory: '自主学习与规划', defaultExp: 50, type: 'TASK', difficulty: 4, description: '改进目标' },
      { name: '今天在课堂上至少举手回答1次问题', category: '自主性', educationalDomain: '核心教学法', educationalSubcategory: '课堂互动与深度参与', defaultExp: 30, type: 'TASK', difficulty: 3, description: '举手回答' },
      { name: '每节课准备1个有思考的问题，课后请教老师', category: '自主性', educationalDomain: '核心教学法', educationalSubcategory: '课堂互动与深度参与', defaultExp: 35, type: 'TASK', difficulty: 3, description: '课堂提问' },

      // 7. 特色教学
      { name: '用"三色笔法"整理作业', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '基础学习方法论', defaultExp: 10, type: 'TASK', difficulty: 2, description: '三色笔法' },
      { name: '自评当日作业质量并简写理由', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '基础学习方法论', defaultExp: 10, type: 'TASK', difficulty: 2, description: '作业自评' },
      { name: '一道"说题"练习：口头讲解解题思路', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '数学思维与解题策略', defaultExp: 30, type: 'TASK', difficulty: 4, description: '说题练习' },
      { name: '高阶任务：从课本和所有练习中找出1类"母题"', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '数学思维与解题策略', defaultExp: 100, type: 'TASK', difficulty: 5, description: '母题归纳' },
      { name: '高阶任务：主动重做一遍昨天的错题', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '数学思维与解题策略', defaultExp: 100, type: 'TASK', difficulty: 5, description: '错题主动重做' },
      { name: '高阶任务：用解题模型表，完整独立练习一道难题', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '数学思维与解题策略', defaultExp: 50, type: 'TASK', difficulty: 4, description: '解题模型' },
      { name: '学习并运用一种阅读理解解题模板', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 30, type: 'TASK', difficulty: 3, description: '阅读理解模板' },
      { name: '想一想·记一记：通过偏旁联想深度记忆', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '语文学科能力深化', defaultExp: 30, type: 'TASK', difficulty: 3, description: '联想记忆' },
      { name: '记录老师今天讲的1个"金句"或方法', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '课堂互动与深度参与', defaultExp: 30, type: 'TASK', difficulty: 3, description: '记录金句' },
      { name: '录制一个60秒"小老师"视频', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '高阶输出与创新', defaultExp: 50, type: 'TASK', difficulty: 4, description: '小老师视频' },
      { name: '向家长讲解1个今天在托管学到的学习方法', category: '特色教学', educationalDomain: '核心教学法', educationalSubcategory: '家庭联结与知识迁移', defaultExp: 50, type: 'TASK', difficulty: 4, description: '家长讲解' },

      // 8. 学校
      { name: '一项集体贡献任务（浇花/整理书架/打扫等）', category: '学校', educationalDomain: '综合成长', educationalSubcategory: '责任感', defaultExp: 15, type: 'TASK', difficulty: 1, description: '集体贡献' },
      { name: '为班级图书角推荐一本书，并写一句推荐语', category: '学校', educationalDomain: '综合成长', educationalSubcategory: '责任感', defaultExp: 10, type: 'TASK', difficulty: 2, description: '图书推荐' },
      { name: '帮助同学（讲解/拍视频/打印等）', category: '学校', educationalDomain: '综合成长', educationalSubcategory: '协作与创造', defaultExp: 10, type: 'TASK', difficulty: 2, description: '帮助同学' },
      { name: '主动申请一次板演/领读/小组汇报等课堂角色', category: '学校', educationalDomain: '核心教学法', educationalSubcategory: '课堂互动与深度参与', defaultExp: 35, type: 'TASK', difficulty: 3, description: '课堂角色' },
      { name: '帮助同桌理解一个课堂没听懂的知识点', category: '学校', educationalDomain: '核心教学法', educationalSubcategory: '课堂互动与深度参与', defaultExp: 30, type: 'TASK', difficulty: 3, description: '帮助同桌' },
      { name: '一项创意表达任务（画画/写日记/做手工等）', category: '学校', educationalDomain: '综合成长', educationalSubcategory: '协作与创造', defaultExp: 15, type: 'TASK', difficulty: 2, description: '创意表达' },
      { name: '一项健康活力任务（眼保健操/拉伸/深呼吸/跳绳等）', category: '学校', educationalDomain: '综合成长', educationalSubcategory: '责任感', defaultExp: 20, type: 'TASK', difficulty: 1, description: '健康活力' },
      { name: '离校前的个人卫生清理（桌面/抽屉/地面）', category: '学校', educationalDomain: '综合成长', educationalSubcategory: '责任感', defaultExp: 20, type: 'TASK', difficulty: 1, description: '个人卫生' },
      { name: '离校前的书包整理', category: '学校', educationalDomain: '综合成长', educationalSubcategory: '责任感', defaultExp: 20, type: 'TASK', difficulty: 1, description: '书包整理' },
      { name: '吃饭时帮助维护秩序，确认光盘，地面保持干净', category: '学校', educationalDomain: '综合成长', educationalSubcategory: '责任感', defaultExp: 20, type: 'TASK', difficulty: 1, description: '维护秩序' },

      // 9. 家庭
      { name: '与家人共读30分钟', category: '家庭', educationalDomain: '综合成长', educationalSubcategory: '家庭联结', defaultExp: 40, type: 'TASK', difficulty: 2, description: '家庭共读' },
      { name: '帮家里完成一项力所能及的家务', category: '家庭', educationalDomain: '综合成长', educationalSubcategory: '家庭联结', defaultExp: 40, type: 'TASK', difficulty: 1, description: '家庭家务' },
      { name: '教家人一个今天学的新词/成语/英语句子', category: '家庭', educationalDomain: '核心教学法', educationalSubcategory: '家庭联结与知识迁移', defaultExp: 50, type: 'TASK', difficulty: 3, description: '教家人新知' },
      { name: '复习本周所有基础知识...主动给爸妈看', category: '家庭', educationalDomain: '核心教学法', educationalSubcategory: '家庭联结与知识迁移', defaultExp: 100, type: 'TASK', difficulty: 4, description: '展示复习成果' },
      { name: '和父母分享今天的"改进目标"完成情况', category: '家庭', educationalDomain: '核心教学法', educationalSubcategory: '家庭联结与知识迁移', defaultExp: 100, type: 'TASK', difficulty: 4, description: '分享改进目标' },
      { name: '用数学知识解决一个家庭小问题', category: '家庭', educationalDomain: '核心教学法', educationalSubcategory: '家庭联结与知识迁移', defaultExp: 30, type: 'TASK', difficulty: 2, description: '家庭数学问题' }
    ];

    const taskCount = tasks.length;
    console.log(`📝 准备创建 ${taskCount} 个任务...`);

    // 批量创建任务
    await prisma.taskLibrary.createMany({
      data: tasks
    });

    console.log(`✅ 成功创建 ${taskCount} 个任务！`);

    // 统计信息
    const stats = await prisma.taskLibrary.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      _sum: {
        defaultExp: true
      }
    });

    console.log('\n📊 分类统计:');
    const categoryOrder = ['基础作业', '语文', '数学', '英语', '阅读', '自主性', '特色教学', '学校', '家庭'];
    categoryOrder.forEach(category => {
      const stat = stats.find(s => s.category === category);
      if (stat) {
        console.log(`  ${category}: ${stat._count.id} 个任务, 总经验值: ${stat._sum.defaultExp}`);
      }
    });

    const totalTasks = stats.reduce((sum, stat) => sum + stat._count.id, 0);
    const totalExp = stats.reduce((sum, stat) => sum + (stat._sum.defaultExp || 0), 0);
    console.log(`\n🎯 总计: ${totalTasks} 个任务, 总经验值: ${totalExp}`);

  } catch (error) {
    console.error('❌ 更新任务分类失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTaskCategories();