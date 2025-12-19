
// import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000'; // 假设本地开发环境
const PUBLIC_URL = 'https://esboimzbkure.sealosbja.site'; // 公网生产环境，用于对比或测试

/**
 * 模拟龙老师发布备课并验证学生端状态更新
 */
async function verifyTeacherStudentFlow() {
  const { execSync } = require('child_process');

  console.log('🚀 [TEST] 开始自动化回归测试...');

  try {
    // 1. 获取 Token
    console.log('🔑 获取教师 Token...');
    execSync('node /home/devbox/project/arkok-v2/create-teacher-token.js');
    const token = require('fs').readFileSync('/tmp/teacher-token.txt', 'utf8').trim();
    if (!token) throw new Error('Token not found in /tmp/teacher-token.txt');

    // 2. 模拟发布 (使用 axios)
    const axios = require('axios');
    const testUnit = Math.floor(Math.random() * 100).toString();
    const testLesson = Math.floor(Math.random() * 100).toString();

    console.log(`📡 发布新备课: Unit ${testUnit}, Lesson ${testLesson}`);

    const publishRes = await axios.post(`${BASE_URL}/api/lms/publish`, {
      courseInfo: {
        title: "回归测试课程",
        date: new Date().toISOString(),
        chinese: { unit: testUnit, lesson: testLesson, title: "回归测试语文" },
        math: { unit: "1", lesson: "1", title: "默认数学" },
        english: { unit: "1", title: "Default English" }
      },
      qcTasks: [
        { taskName: `QC回归-${testUnit}-${testLesson}`, category: "语文", defaultExp: 10 }
      ],
      progress: {
        chinese: { unit: testUnit, lesson: testLesson, title: "回归测试语文" }
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!publishRes.data.success) throw new Error('发布失败');
    console.log('✅ 备课发布成功');

    // 3. 验证学生状态更新 (PATCH /api/lms/records/:id/status)
    // 先获取刚生成的记录 ID
    console.log('🔍 获取生成的任务记录...');
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const teacherId = payload.userId;

    // 获取老师名下的第一个学生
    const studentsRes = await axios.get(`${BASE_URL}/api/students?scope=MY_STUDENTS&teacherId=${teacherId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const student = studentsRes.data.data.students[0];
    if (!student) throw new Error('未找到学生');

    // 验证学生快照是否已更新
    console.log(`📊 检查学生 [${student.name}] 的快照状态: ${student.currentUnit}-${student.currentLesson}`);
    if (student.currentUnit !== testUnit || student.currentLesson !== testLesson) {
      console.warn(`⚠️ 学生快照未同步更新! Expected: ${testUnit}-${testLesson}, Actual: ${student.currentUnit}-${student.currentLesson}`);
    } else {
      console.log('✅ 学生快照同步更新成功');
    }

    const today = new Date().toISOString().split('T')[0];
    const recordsRes = await axios.get(`${BASE_URL}/api/lms/daily-records?studentId=${student.id}&date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const qcTask = recordsRes.data.data.find(r => r.title.includes(`QC回归-${testUnit}-${testLesson}`));
    if (!qcTask) throw new Error('未找到生成的 QC 任务记录');

    console.log(`🎯 正在执行状态更新测试: ID=${qcTask.id} -> COMPLETED`);

    const patchRes = await axios.patch(`${BASE_URL}/api/lms/records/${qcTask.id}/status`, {
      status: 'COMPLETED'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (patchRes.data.success) {
      console.log('🎉 [SUCCESS] PATCH /api/lms/records/:id/status 验证通过！');
    } else {
      console.error('❌ [FAILED] 状态更新失败:', patchRes.data);
    }

  } catch (error) {
    console.error('❌ [ERROR] 测试执行失败:', error.response?.data || error.message);
    process.exit(1);
  }
}

verifyTeacherStudentFlow();
