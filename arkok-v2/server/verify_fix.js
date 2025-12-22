
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    const schoolId = '4187ed55-da45-4553-8362-be189ac3dfb5';

    try {
        // 1. 查找或创建学生
        let student = await prisma.students.findFirst({
            where: { schoolId },
            include: { task_records: { take: 1 } }
        });

        if (!student) {
            console.log('未找到测试学生，正在创建...');
            student = await prisma.students.create({
                data: {
                    id: 'test-student-' + Date.now(),
                    schoolId,
                    name: '测试学生',
                    className: '测试班级',
                    updatedAt: new Date()
                },
                include: { task_records: true }
            });
        }

        // 2. 查找或创建任务
        let task = student.task_records[0];
        if (!task) {
            console.log('该学生没有任务，正在创建测试任务...');
            task = await prisma.task_records.create({
                data: {
                    id: 'test-task-' + Date.now(),
                    schoolId,
                    studentId: student.id,
                    type: 'QC',
                    title: '测试任务',
                    status: 'PENDING',
                    updatedAt: new Date()
                }
            });
        }

        console.log(`初始任务 ID: ${task.id}, 状态: ${task.status}`);

        // 模拟前端传递的课程进度快照
        const testCourseInfo = {
            chinese: { unit: "99", lesson: "99", title: "验证测试课程" }
        };

        // 3. 执行更新逻辑（模拟 PATCH /records/:id/status）
        const updated = await prisma.task_records.update({
            where: { id: task.id },
            data: {
                status: 'COMPLETED',
                isOverridden: true,
                content: {
                    ...((task.content) || {}),
                    courseInfo: testCourseInfo
                },
                updatedAt: new Date()
            }
        });

        console.log(`更新后任务 ID: ${updated.id}, 状态: ${updated.status}, isOverridden: ${updated.isOverridden}`);
        console.log(`Content 中的 CourseInfo: ${JSON.stringify(updated.content?.courseInfo)}`);

        // 4. 最终验证
        if (updated.isOverridden === true && updated.content?.courseInfo?.chinese?.unit === "99") {
            console.log('✅ 验证成功：courseInfo 已正确持久化，且 isOverridden 标志已设置。');
        } else {
            console.log('❌ 验证失败：数据结构不符合预期。');
        }
    } catch (err) {
        console.error('验证过程中发生错误:', err);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
