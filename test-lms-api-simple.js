const fetch = require('node-fetch');

async function testLMSPublish() {
    try {
        console.log('🚀 开始测试LMS发布API...');

        // 1. 登录获取认证token
        console.log('📝 登录获取认证token...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'long',
                password: '123456'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.data.token;
        console.log('✅ 登录成功，获取到token');

        // 2. 获取任务库数据
        console.log('📚 获取任务库数据...');
        const taskLibraryResponse = await fetch('http://localhost:3000/api/lms/task-library', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!taskLibraryResponse.ok) {
            throw new Error(`Task library request failed: ${taskLibraryResponse.status}`);
        }

        const taskLibraryData = await taskLibraryResponse.json();
        console.log(`✅ 获取任务库成功，共 ${taskLibraryData.data.length} 个任务`);

        // 3. 测试备课发布API
        console.log('📢 测试备课发布API...');
        const publishData = {
            courseInfo: {
                title: 'API测试课程',
                date: '2025-12-18',
                chinese: { unit: '1', lesson: '1', title: '第一单元 语文课程' },
                math: { unit: '1', lesson: '1', title: '第一单元 数学课程' },
                english: { unit: '1', title: 'Unit 1 English Course' }
            },
            progress: {
                chinese: '第一单元 语文课程',
                math: '第一单元 数学课程',
                english: 'Unit 1 English Course'
            },
            qcTasks: [
                {
                    taskName: '语文质量控制',
                    category: '核心教法',
                    difficulty: 1,
                    defaultExp: 5
                }
            ],
            normalTasks: [
                {
                    taskName: '数学作业',
                    category: '基础作业',
                    taskId: 'math-hw-001',
                    defaultExp: 10
                }
            ],
            specialTasks: [
                {
                    taskName: '英语拓展练习',
                    category: '个性化任务',
                    description: '针对学生的英语拓展练习',
                    defaultExp: 15
                }
            ]
        };

        const publishResponse = await fetch('http://localhost:3000/api/lms/publish', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(publishData)
        });

        if (!publishResponse.ok) {
            const errorText = await publishResponse.text();
            throw new Error(`Publish failed: ${publishResponse.status} - ${errorText}`);
        }

        const publishResult = await publishResponse.json();
        console.log('✅ 备课发布成功');
        console.log('发布结果:', JSON.stringify(publishResult, null, 2));

        // 4. 测试最新教案回填接口
        console.log('📅 测试最新教案回填接口...');
        const latestLessonResponse = await fetch('http://localhost:3000/api/lms/latest-lesson-plan', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (latestLessonResponse.ok) {
            const latestLessonData = await latestLessonResponse.json();
            console.log('✅ 最新教案回填成功');
            console.log('课程进度数据:', {
                chinese: latestLessonData.data.courseInfo?.chinese?.title,
                math: latestLessonData.data.courseInfo?.math?.title,
                english: latestLessonData.data.courseInfo?.english?.title
            });
        } else {
            console.log('⚠️ 最新教案回填失败:', latestLessonResponse.status);
        }

        console.log('\n🎉 LMS发布API测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        process.exit(1);
    }
}

// 运行测试
testLMSPublish();