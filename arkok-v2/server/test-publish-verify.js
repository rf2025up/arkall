const axios = require('axios');

async function testPublish() {
  const BASE_URL = 'https://arkok-v2-api.sealos.run/api';

  try {
    console.log('1. 尝试使用龙老师账号登录...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'long',
      password: '123456'
    });

    if (!loginRes.data.success) {
      console.error('❌ 登录失败:', loginRes.data.message);
      return;
    }

    const token = loginRes.data.token;
    const user = loginRes.data.user;
    console.log('✅ 登录成功:', { name: user.name, schoolId: user.schoolId });

    console.log('2. 尝试发布备课计划...');
    const publishData = {
      courseInfo: {
        title: '集成测试备课计划 - ' + new Date().toLocaleTimeString(),
        date: new Date().toISOString(),
        chinese: { unit: '2', lesson: '3', title: '草船借箭' },
        math: { unit: '3', lesson: '1', title: '圆柱的体积' },
        english: { unit: '4', title: 'Amazing Animals' }
      },
      qcTasks: [
        { taskName: '草船借箭背景背诵', category: '语文过关', defaultExp: 10, difficulty: 2 },
        { taskName: '圆柱体积公式推导', category: '数学过关', defaultExp: 8, difficulty: 3 }
      ],
      normalTasks: [
        { taskName: '特色教学：思维导图绘制', category: '核心教学法', defaultExp: 15 }
      ],
      specialTasks: [],
      progress: {
        chinese: { unit: '2', lesson: '3' }
      }
    };

    const publishRes = await axios.post(`${BASE_URL}/lms/publish`, publishData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ 发布响应:', JSON.stringify(publishRes.data, null, 2));

    console.log('3. 验证回填逻辑 (获取最新教学计划)...');
    const latestRes = await axios.get(`${BASE_URL}/lms/latest-lesson-plan`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ 回填数据响应:', JSON.stringify(latestRes.data, null, 2));

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }
}

testPublish();
