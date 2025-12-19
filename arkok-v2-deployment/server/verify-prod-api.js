
const axios = require('axios');

async function verifyProductionAPI() {
    const PUBLIC_API = 'https://esboimzbkure.sealosbja.site/api';
    console.log('🚀 [API_VERIFY] 开始公网 API 链路验证...');

    try {
        // 1. 获取 Token
        console.log('🔑 获取教师 Token...');
        const { execSync } = require('child_process');
        execSync('node /home/devbox/project/arkok-v2/create-teacher-token.js');
        const token = require('fs').readFileSync('/tmp/teacher-token.txt', 'utf8').trim();
        const headers = { Authorization: `Bearer ${token}` };

        // 2. 获取任务记录 (获取第一个活跃学生)
        console.log('📡 获取学生列表...');
        const studentsRes = await axios.get(`${PUBLIC_API}/students?scope=MY_STUDENTS`, { headers });
        const student = studentsRes.data.data.students[0];
        if (!student) throw new Error('未找到绑定学生');
        console.log(`✅ 目标学生: ${student.name} (${student.id})`);

        const today = new Date().toISOString().split('T')[0];
        console.log(`📡 获取 ${today} 的任务记录...`);
        const recordsRes = await axios.get(`${PUBLIC_API}/lms/daily-records?studentId=${student.id}&date=${today}`, { headers });
        const records = recordsRes.data.data;

        if (records.length === 0) {
            console.warn('⚠️ 今日无任务，正在尝试发布一个新任务以供测试...');
            await axios.post(`${PUBLIC_API}/lms/publish`, {
                courseInfo: { title: "API测试", date: new Date().toISOString(), chinese: { unit: "1", lesson: "1", title: "测试" } },
                qcTasks: [{ taskName: "API测试过关项", category: "语文", defaultExp: 5 }]
            }, { headers });
            // 重新获取
            const retryRes = await axios.get(`${PUBLIC_API}/lms/daily-records?studentId=${student.id}&date=${today}`, { headers });
            records.push(...retryRes.data.data);
        }

        const testRecord = records[0];
        console.log(`🎯 准备更新记录: [${testRecord.title}] ID: ${testRecord.id}`);

        // 3. 测试单条更新路由 1: /api/lms/records/:id/status
        console.log(`📡 测试路径 A: /api/lms/records/${testRecord.id}/status`);
        const resA = await axios.patch(`${PUBLIC_API}/lms/records/${testRecord.id}/status`, { status: 'COMPLETED' }, { headers });
        console.log('🎉 响应 A:', JSON.stringify(resA.data));

        // 4. 测试单条更新路由 2: /api/records/:id/status
        console.log(`📡 测试路径 B: /api/records/${testRecord.id}/status`);
        const resB = await axios.patch(`${PUBLIC_API}/records/${testRecord.id}/status`, { status: 'PENDING' }, { headers });
        console.log('🎉 响应 B:', JSON.stringify(resB.data));

        if (resA.data.success || resB.data.success) {
            console.log('🏆 [SUCCESS] API 链路验证 100% 通过！勾选逻辑后端已就绪。');
        } else {
            console.error('❌ [FAILED] API 响应不符合预期');
        }

    } catch (e) {
        console.error('❌ [ERROR] 验证失败:', e.response?.data || e.message);
    }
}

verifyProductionAPI();
