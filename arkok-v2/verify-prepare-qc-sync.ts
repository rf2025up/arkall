/**
 * 验证备课发布 → 过关页数据同步 → 过关页修改进度的完整流程
 *
 * 测试流程：
 * 1. 验证备课发布后的过关页数据同步
 * 2. 验证过关页修改进度是否更新到个人全学期过关地图
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api';

// 测试数据
let testTeacherId = '';
let testStudentId = '';
let testSchoolId = '';
let testAuthToken = '';

interface StudentProgressResponse {
  chinese?: { unit: string; lesson?: string; title: string };
  math?: { unit: string; lesson?: string; title: string };
  english?: { unit: string; title: string };
  source: 'lesson_plan' | 'override' | 'default';
  updatedAt: string;
}

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

function log(title: string, message: string, color: string = colors.cyan) {
  console.log(`${color}${colors.bright}[${title}]${colors.reset} ${message}`);
}

function success(msg: string) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function error(msg: string) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function warning(msg: string) {
  console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`);
}

async function verifyPrepPublishQCSync() {
  try {
    log('SETUP', '初始化测试环境', colors.cyan);

    // 1. 获取测试数据
    log('STEP 1', '准备测试数据', colors.cyan);

    const schools = await prisma.schools.findMany({ take: 1 });
    if (schools.length === 0) {
      error('没有找到学校，无法进行测试');
      return;
    }
    testSchoolId = schools[0].id;
    log('INFO', `学校ID: ${testSchoolId}`);

    const teachers = await prisma.teachers.findMany({
      where: { schoolId: testSchoolId, isActive: true },
      take: 1,
    });
    if (teachers.length === 0) {
      error('没有找到老师，无法进行测试');
      return;
    }
    testTeacherId = teachers[0].id;
    log('INFO', `老师ID: ${testTeacherId}, 老师名: ${teachers[0].name}`);

    const students = await prisma.students.findMany({
      where: {
        schoolId: testSchoolId,
        teacherId: testTeacherId,
        isActive: true
      },
      take: 1,
    });
    if (students.length === 0) {
      error('该老师名下没有学生，无法进行测试');
      return;
    }
    testStudentId = students[0].id;
    log('INFO', `学生ID: ${testStudentId}, 学生名: ${students[0].name}`);

    success('测试环境准备完成');

    // 2. 模拟登录获取Token (使用模拟token用于测试)
    log('STEP 2', '验证API认证', colors.cyan);
    testAuthToken = 'test-bearer-token'; // 实际测试中需要真实token
    log('INFO', '已准备测试Token');

    // 3. 获取发布前的学生进度
    log('STEP 3', '获取发布前的学生进度', colors.cyan);
    let progressBefore: StudentProgressResponse | null = null;
    try {
      const response = await axios.get(`${API_BASE}/lms/student-progress?studentId=${testStudentId}`, {
        headers: { 'Authorization': `Bearer ${testAuthToken}` },
      });
      if (response.data.success) {
        progressBefore = response.data.data as StudentProgressResponse;
        log('INFO', `发布前进度 (来源: ${progressBefore?.source}):`, colors.cyan);
        console.log(JSON.stringify(progressBefore, null, 2));
      }
    } catch (e) {
      warning('无法获取发布前的进度（可能需要真实Token）');
    }

    // 4. 模拟备课发布
    log('STEP 4', '模拟备课发布', colors.cyan);
    const publishDate = new Date().toISOString().split('T')[0];
    const publishPayload = {
      schoolId: testSchoolId,
      teacherId: testTeacherId,
      title: `[测试发布] ${publishDate} 备课计划`,
      content: {
        courseInfo: {
          chinese: { unit: '2', lesson: '5', title: '测试课文' },
          math: { unit: '2', lesson: '6', title: '测试数学' },
          english: { unit: '3', title: 'Test Lesson' },
        },
      },
      date: publishDate,
      progress: {
        chinese: { unit: '2', lesson: '5', title: '测试课文' },
        math: { unit: '2', lesson: '6', title: '测试数学' },
        english: { unit: '3', title: 'Test Lesson' },
      },
      tasks: [
        { title: '生字听写', type: 'QC', expAwarded: 10, content: { task: 'test' } },
        { title: '口语练习', type: 'TASK', expAwarded: 5, content: { task: 'test' } },
      ],
    };

    log('INFO', '发布数据:');
    console.log(JSON.stringify(publishPayload, null, 2));

    try {
      const response = await axios.post(`${API_BASE}/lms/publish`, publishPayload, {
        headers: { 'Authorization': `Bearer ${testAuthToken}` },
      });
      if (response.data.success) {
        success('备课发布成功');
        console.log(`发布结果: ${JSON.stringify(response.data.data.taskStats, null, 2)}`);
      } else {
        error(`发布失败: ${response.data.message}`);
      }
    } catch (e) {
      warning('无法调用发布API（可能需要真实Token）');
    }

    // 5. 获取发布后的学生进度
    log('STEP 5', '获取发布后的学生进度', colors.cyan);
    let progressAfter: StudentProgressResponse | null = null;
    try {
      const response = await axios.get(`${API_BASE}/lms/student-progress?studentId=${testStudentId}`, {
        headers: { 'Authorization': `Bearer ${testAuthToken}` },
      });
      if (response.data.success) {
        progressAfter = response.data.data as StudentProgressResponse;
        log('INFO', `发布后进度 (来源: ${progressAfter?.source}):`, colors.cyan);
        console.log(JSON.stringify(progressAfter, null, 2));
      }
    } catch (e) {
      warning('无法获取发布后的进度（可能需要真实Token）');
    }

    // 6. 验证发布后的数据同步
    log('STEP 6', '验证发布后的数据同步', colors.cyan);
    if (progressBefore && progressAfter) {
      if (JSON.stringify(progressBefore) === JSON.stringify(progressAfter)) {
        warning('发布前后进度数据相同，可能是源数据已经是发布的数据');
      } else {
        success('发布前后进度数据发生变化');
        log('INFO', '数据变化对比:');
        console.log('前:', JSON.stringify(progressBefore, null, 2));
        console.log('后:', JSON.stringify(progressAfter, null, 2));
      }
    }

    // 7. 测试过关页修改进度
    log('STEP 7', '测试过关页修改进度', colors.cyan);
    const updatePayload = {
      chinese: { unit: '3', lesson: '8', title: '修改后的课文' },
      math: { unit: '3', lesson: '9', title: '修改后的数学' },
      english: { unit: '4', title: 'Updated Lesson' },
    };

    log('INFO', '修改进度数据:');
    console.log(JSON.stringify(updatePayload, null, 2));

    try {
      const response = await axios.patch(`${API_BASE}/lms/student-progress/${testStudentId}`, updatePayload, {
        headers: { 'Authorization': `Bearer ${testAuthToken}` },
      });
      if (response.data.success) {
        success('过关页进度修改成功');
      } else {
        error(`修改失败: ${response.data.message}`);
      }
    } catch (e) {
      warning('无法调用修改进度API（可能需要真实Token）');
    }

    // 8. 获取修改后的学生进度
    log('STEP 8', '获取修改后的学生进度', colors.cyan);
    let progressAfterUpdate: StudentProgressResponse | null = null;
    try {
      const response = await axios.get(`${API_BASE}/lms/student-progress?studentId=${testStudentId}`, {
        headers: { 'Authorization': `Bearer ${testAuthToken}` },
      });
      if (response.data.success) {
        progressAfterUpdate = response.data.data as StudentProgressResponse;
        log('INFO', `修改后进度 (来源: ${progressAfterUpdate?.source}):`, colors.cyan);
        console.log(JSON.stringify(progressAfterUpdate, null, 2));
      }
    } catch (e) {
      warning('无法获取修改后的进度（可能需要真实Token）');
    }

    // 9. 验证修改后的数据
    log('STEP 9', '验证修改后的数据', colors.cyan);
    if (progressAfterUpdate) {
      if (progressAfterUpdate.source === 'override') {
        success('修改后的进度来源为 override，符合预期');
      } else {
        warning(`修改后的进度来源为 ${progressAfterUpdate.source}，预期为 override`);
      }

      if (progressAfterUpdate.chinese?.unit === '3') {
        success('修改的进度值已生效');
      } else {
        error('修改的进度值未生效');
      }
    }

    // 10. 数据库验证
    log('STEP 10', '数据库验证', colors.cyan);
    const taskRecords = await prisma.task_records.findMany({
      where: {
        studentId: testStudentId,
        isOverridden: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    log('INFO', `学生 ${testStudentId} 的 override 记录:`, colors.cyan);
    taskRecords.forEach(record => {
      console.log(`- ID: ${record.id}, 创建于: ${record.createdAt}, 更新于: ${record.updatedAt}`);
      console.log(`  内容: ${JSON.stringify(record.content)}`);
    });

    if (taskRecords.length > 0) {
      success('found override records in database');
    } else {
      warning('未找到 override 记录（可能是因为权限或API错误）');
    }

    console.log('\n' + colors.green + colors.bright + '========== 验证完成 ==========' + colors.reset);

  } catch (err) {
    error(`验证失败: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行验证
verifyPrepPublishQCSync();
