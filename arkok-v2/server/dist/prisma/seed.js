"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('开始种子数据初始化...');
    // 清理现有数据（可选）
    // await prisma.taskLibrary.deleteMany();
    // 创建 TaskLibrary 初始数据
    const taskLibraryData = [
        // 基础核心
        { category: '基础核心', name: '完成作业', description: '按时完成今日作业', defaultExp: 10, type: 'TASK', difficulty: 2 },
        { category: '基础核心', name: '课堂笔记', description: '认真记录课堂笔记', defaultExp: 5, type: 'TASK', difficulty: 1 },
        { category: '基础核心', name: '预习功课', description: '提前预习明日课程', defaultExp: 8, type: 'TASK', difficulty: 3 },
        // 数学巩固
        { category: '数学巩固', name: '口算练习', description: '完成口算练习题', defaultExp: 6, type: 'TASK', difficulty: 1 },
        { category: '数学巩固', name: '应用题解答', description: '完成数学应用题', defaultExp: 12, type: 'TASK', difficulty: 3 },
        { category: '数学巩固', name: '错题整理', description: '整理数学错题本', defaultExp: 8, type: 'TASK', difficulty: 2 },
        // 语文专项
        { category: '语文专项', name: '背诵课文', description: '背诵指定课文段落', defaultExp: 8, type: 'TASK', difficulty: 2 },
        { category: '语文专项', name: '写字练习', description: '完成字帖练习', defaultExp: 6, type: 'TASK', difficulty: 1 },
        { category: '语文专项', name: '阅读理解', description: '完成阅读理解练习', defaultExp: 10, type: 'TASK', difficulty: 3 },
        // 英语提升
        { category: '英语提升', name: '单词记忆', description: '记忆英语单词', defaultExp: 6, type: 'TASK', difficulty: 2 },
        { category: '英语提升', name: '口语练习', description: '英语口语对话练习', defaultExp: 8, type: 'TASK', difficulty: 3 },
        { category: '英语提升', name: '听力训练', description: '英语听力练习', defaultExp: 7, type: 'TASK', difficulty: 2 },
        // 质检任务 (QC)
        { category: '质检', name: '作业质检', description: '检查作业完成质量', defaultExp: 5, type: 'QC', difficulty: 1 },
        { category: '质检', name: '课堂表现质检', description: '课堂学习态度检查', defaultExp: 8, type: 'QC', difficulty: 2 },
        // 特殊任务
        { category: '特殊', name: '助人为乐', description: '帮助同学解决问题', defaultExp: 15, type: 'SPECIAL', difficulty: 3 },
        { category: '特殊', name: '创新思维', description: '提出创新想法或解决方案', defaultExp: 20, type: 'SPECIAL', difficulty: 4 },
        { category: '特殊', name: '小组合作', description: '参与小组项目合作', defaultExp: 12, type: 'SPECIAL', difficulty: 3 },
    ];
    console.log('正在创建 TaskLibrary 数据...');
    for (const taskData of taskLibraryData) {
        await prisma.taskLibrary.upsert({
            where: {
                // 使用唯一约束来避免重复创建
                category_name: {
                    category: taskData.category,
                    name: taskData.name
                }
            },
            update: {
                ...taskData,
                type: taskData.type
            },
            create: {
                ...taskData,
                type: taskData.type
            }
        });
    }
    console.log('TaskLibrary 种子数据创建完成');
    console.log('种子数据初始化完成！');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map