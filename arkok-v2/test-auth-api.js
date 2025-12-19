const axios = require('axios');

async function testTaskLibraryWithAuth() {
  try {
    console.log('🔐 测试登录...');

    // 1. 登录获取token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'long',
      password: '123456'
    });

    console.log('登录响应状态:', loginResponse.status);
    console.log('登录成功:', loginResponse.data.success);

    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ 获取到token:', token.substring(0, 20) + '...');

      // 2. 使用token获取任务库
      console.log('\n📚 测试任务库API...');
      const taskResponse = await axios.get('http://localhost:3000/api/lms/task-library', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('任务库响应状态:', taskResponse.status);
      console.log('任务库获取成功:', taskResponse.data.success);

      if (taskResponse.data.success && taskResponse.data.data) {
        const tasks = taskResponse.data.data;
        console.log(`✅ 成功获取任务库，任务数量: ${tasks.length}`);

        // 统计分类
        const categories = {};
        tasks.forEach(task => {
          if (!categories[task.category]) {
            categories[task.category] = 0;
          }
          categories[task.category]++;
        });

        console.log('\n📊 分类统计:');
        Object.entries(categories).forEach(([category, count]) => {
          console.log(`  ${category}: ${count} 个任务`);
        });

        // 检查核心教学法分类
        const methodologyCategories = [
          '基础学习方法论',
          '数学思维与解题策略',
          '语文学科能力深化',
          '英语应用与输出',
          '阅读深度与分享',
          '自主学习与规划',
          '课堂互动与深度参与',
          '家庭联结与知识迁移',
          '高阶输出与创新'
        ];

        const methodologyTasks = tasks.filter(task =>
          methodologyCategories.includes(task.category)
        );

        const growthTasks = tasks.filter(task => task.category === '综合成长');

        console.log(`\n🎯 核心教学法任务: ${methodologyTasks.length} 个`);
        console.log(`🌱 综合成长任务: ${growthTasks.length} 个`);

        // 显示核心教学法任务详情
        if (methodologyTasks.length > 0) {
          console.log('\n🎯 核心教学法任务详情:');
          const methodologyByCategory = {};
          methodologyTasks.forEach(task => {
            if (!methodologyByCategory[task.category]) {
              methodologyByCategory[task.category] = [];
            }
            methodologyByCategory[task.category].push(task);
          });

          Object.entries(methodologyByCategory).forEach(([category, tasks]) => {
            console.log(`\n  ${category}:`);
            tasks.forEach(task => {
              console.log(`    - ${task.name} (${task.defaultExp} EXP)`);
            });
          });
        }

        // 显示综合成长任务详情
        if (growthTasks.length > 0) {
          console.log('\n🌱 综合成长任务详情:');
          growthTasks.forEach(task => {
            console.log(`    - ${task.name} (${task.defaultExp} EXP)`);
          });
        }
      }
    } else {
      console.error('❌ 登录失败:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testTaskLibraryWithAuth();