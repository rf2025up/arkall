const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE_URL = 'http://localhost:3000/api'; // 已修正为实际端口 3000

async function testIntegration() {
    try {
        console.log('🚀 开始集成测试...');

        // 1. 获取 admin 老师
        const teacher = await prisma.teachers.findFirst({
            where: { username: 'admin' }
        });

        if (!teacher) {
            console.error('❌ 未找到 admin 老师，请确保数据库已初始化。');
            return;
        }

        console.log(`👤 使用老师: ${teacher.username}，准备登录...`);

        // 登录获取 Token
        let token;
        try {
            const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
                username: 'admin',
                password: '123456'
            });
            token = loginRes.data.token;
            console.log('✅ 登录成功。');
        } catch (e) {
            console.error('❌ 登录失败，请确保服务器 npm run dev 已启动且端口为 3000。');
            return;
        }

        // 2. 确保有测试学生和任务
        let student = await prisma.students.findFirst({
            where: { schoolId: teacher.schoolId },
            include: { task_records: { take: 1 } }
        });

        if (!student) {
            console.log('📝 未找到学生，正在创建测试学生...');
            student = await prisma.students.create({
                data: {
                    id: 'it-student-' + Date.now(),
                    schoolId: teacher.schoolId,
                    teacherId: teacher.id,
                    name: '集成测试学生',
                    className: '测试班',
                    updatedAt: new Date()
                },
                include: { task_records: true }
            });
        }

        let task = student.task_records[0];
        if (!task) {
            console.log('📝 正在创建测试任务...');
            task = await prisma.task_records.create({
                data: {
                    id: 'it-task-' + Date.now(),
                    schoolId: teacher.schoolId,
                    studentId: student.id,
                    type: 'QC',
                    title: '集成测试任务',
                    status: 'PENDING',
                    updatedAt: new Date()
                }
            });
        }

        console.log(`🎯 目标任务 ID: ${task.id}, 初始状态: ${task.status}`);

        // 3. 发送 API 请求
        const testCourseInfo = {
            chinese: { unit: "INTEGRATION", lesson: "SUCCESS", title: "API 闭环测试" }
        };

        console.log('📡 调用 PATCH /records/:id/status 接口...');
        const updateRes = await axios.patch(
            `${API_BASE_URL}/lms/records/${task.id}/status`,
            {
                status: 'COMPLETED',
                courseInfo: testCourseInfo
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (updateRes.data.success) {
            console.log('✅ API 响应成功。');

            // 4. 后验数据库
            const verifyRecord = await prisma.task_records.findUnique({
                where: { id: task.id }
            });

            console.log('🔍 数据库验证结果:');
            console.log(` - Status: ${verifyRecord.status}`);
            console.log(` - isOverridden: ${verifyRecord.isOverridden}`);
            console.log(` - CourseInfo: ${JSON.stringify(verifyRecord.content?.courseInfo)}`);

            if (verifyRecord.isOverridden && verifyRecord.content?.courseInfo?.chinese?.unit === 'INTEGRATION') {
                console.log('\n🎉 [SUCCESS] 集成测试圆满通过！');
                console.log('修复逻辑已在真实 Web 路由和数据库持久化层成功闭环。');
            } else {
                console.log('\n❌ [FAILED] 数据库状态不符合预期。');
            }
        } else {
            console.error('❌ API 逻辑错误:', updateRes.data.message);
        }

    } catch (error) {
        console.error('💥 运行时错误:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testIntegration();
