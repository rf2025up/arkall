const axios = require('axios');

async function verifyBusinessFlow() {
  const BASE_URL = 'https://esboimzbkure.sealosbja.site/api';
  let token = '';
  let teacherId = '';
  let schoolId = '';
  let testStudentId = '';

  try {
    console.log('--- Phase 1: Authentication ---');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'long',
      password: '123456'
    });

    if (!loginRes.data.success) throw new Error('Login failed');
    token = loginRes.data.token;
    teacherId = loginRes.data.user.userId;
    schoolId = loginRes.data.user.schoolId;
    console.log(`✅ Login Success: ${loginRes.data.user.name}`);
    console.log(`🔍 Debug: teacherId=${teacherId}, schoolId=${schoolId}`);

    console.log('--- Phase 2: Identify Test Target ---');
    const studentRes = await axios.get(`${BASE_URL}/students`, {
      params: { schoolId, teacherId, scope: 'MY_STUDENTS' },
      headers: { 'Authorization': 'Bearer ' + token }
    });

    console.log(`🔍 Debug: Student API response count: ${studentRes.data.students ? studentRes.data.students.length : 0}`);
    const students = studentRes.data.students || [];
    if (students.length === 0) throw new Error('No students found for this teacher');
    testStudentId = students[0].id;
    console.log('✅ Test Student: ' + students[0].name + ' (' + testStudentId + ')');

    console.log('--- Phase 3: Global Publish (Initial State) ---');
    const publishData = {
      schoolId,
      teacherId,
      title: '集成测试 - 初始状态',
      date: new Date().toISOString(),
      content: {
        courseInfo: {
          chinese: { unit: '1', lesson: '3', title: '植物妈妈有办法' },
          math: { unit: '1', lesson: '2', title: '长度单位' },
          english: { unit: '1', title: 'Hello!' }
        }
      },
      tasks: [
        { type: 'QC', title: '验证任务-初始', expAwarded: 10 }
      ],
      progress: {
        chinese: { unit: '1', lesson: '3', title: '植物妈妈有办法' },
        math: { unit: '1', lesson: '2', title: '长度单位' }
      }
    };

    await axios.post(`${BASE_URL}/lms/publish`, publishData, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('✅ Initial Publish Success');

    console.log('--- Phase 4: Personal Override (Manual Update Chinese) ---');
    const overrideData = {
      schoolId,
      studentId: testStudentId,
      teacherId,
      courseInfo: {
        chinese: { unit: '1', lesson: '4', title: '小蝌蚪找妈妈 (已覆盖)' },
        math: { unit: '1', lesson: '2', title: '长度单位' },
        english: { unit: '1', title: 'Hello!' }
      }
    };

    await axios.post(`${BASE_URL}/lms/student-progress/update`, overrideData, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('✅ Personal Override Success');

    console.log('--- Phase 5: Teacher Updates Math Only ---');
    const partialUpdateData = {
      ...publishData,
      title: '集成测试 - 局部更新数学',
      content: {
        courseInfo: {
          chinese: { unit: '1', lesson: '3', title: '植物妈妈有办法' },
          math: { unit: '1', lesson: '3', title: '线段的量法' },
          english: { unit: '1', title: 'Hello!' }
        }
      },
      progress: {
        math: { unit: '1', lesson: '3', title: '线段的量法' }
      }
    };

    await axios.post(`${BASE_URL}/lms/publish`, partialUpdateData, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('✅ Teacher Partial Update Success');

    console.log('--- Phase 6: Final Verification ---');
    const progRes = await axios.get(`${BASE_URL}/lms/student-progress/${testStudentId}`, {
      params: { schoolId },
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const finalProgress = progRes.data;
    console.log('📊 FINAL VERIFICATION RESULTS:');
    console.log('- Chinese: ' + (finalProgress.chinese ? finalProgress.chinese.title : 'N/A'));
    console.log('- Math: ' + (finalProgress.math ? finalProgress.math.title : 'N/A'));
    console.log('- Data Source: ' + finalProgress.source);

    const isChinesePreserved = finalProgress.chinese && finalProgress.chinese.title.includes('已覆盖');
    const isMathUpdated = finalProgress.math && finalProgress.math.title.includes('线段的量法');

    if (isChinesePreserved && isMathUpdated) {
      console.log('🌟 SUCCESS: Smart Merge logic verified!');
    } else {
      console.warn('⚠️ WARNING: Smart Merge results did not match expectations.');
      if (!isChinesePreserved) console.log('- Chinese override was lost');
      if (!isMathUpdated) console.log('- Math update was not applied');
    }

  } catch (error) {
    console.error('❌ Verification Failed:', error.response ? error.response.data : error.message);
  }
}

verifyBusinessFlow();
