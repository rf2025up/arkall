const axios = require('axios');

// 测试API端点
async function testAPIs() {
  const baseURL = 'http://localhost:3000/api';

  try {
    console.log('🧪 开始API测试...');

    // 1. 测试习惯API
    console.log('\n1. 测试 /api/habits 端点...');
    try {
      const habitsResponse = await axios.get(`${baseURL}/habits?schoolId=625e503b-aa7e-44fe-9982-237d828af717`);
      console.log('✅ 习惯API测试成功:', {
        success: habitsResponse.data.success,
        habitsCount: habitsResponse.data.data?.length || 0
      });
    } catch (error) {
      console.log('❌ 习惯API测试失败:', error.response?.status, error.response?.statusText);
    }

    // 2. 测试LMS任务库API
    console.log('\n2. 测试 /api/lms/task-library 端点...');
    try {
      const lmsResponse = await axios.get(`${baseURL}/lms/task-library`);
      console.log('✅ LMS任务库API测试成功:', {
        success: lmsResponse.data.success,
        tasksCount: lmsResponse.data.data?.length || 0
      });
    } catch (error) {
      console.log('❌ LMS任务库API测试失败:', error.response?.status, error.response?.statusText);
    }

    // 3. 测试学生班级API
    console.log('\n3. 测试 /api/students/classes 端点...');
    try {
      const classesResponse = await axios.get(`${baseURL}/students/classes`);
      console.log('✅ 班级API测试成功:', {
        success: classesResponse.data.success,
        classesCount: classesResponse.data.data?.length || 0
      });
    } catch (error) {
      console.log('❌ 班级API测试失败:', error.response?.status, error.response?.statusText);
    }

  } catch (error) {
    console.error('🚨 API测试过程出现错误:', error.message);
  }
}

testAPIs();