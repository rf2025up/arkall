
import axios from 'axios';

// 配置
const BASE_URL = 'http://localhost:3000/api';
const TEACHER_AUTH = { username: 'long', password: 'password' }; // 假设密码，实际通过create-token.js获取或模拟

async function verifyFlow() {
  console.log('🚀 开始全链路业务验证...');

  try {
    const teacherToken = process.env.TEACHER_TOKEN;
    if (!teacherToken) {
      throw new Error('环境变量 TEACHER_TOKEN 未设置');
    }
    const authHeaders = { headers: { Authorization: `Bearer ${teacherToken}` } };

    // 从 Token 解析 teacherId (为了后续获取学生)
    const payload = JSON.parse(Buffer.from(teacherToken.split('.')[1], 'base64').toString());
    const teacherId = payload.userId;

    console.log(`✅ Token 加载成功, TeacherID: ${teacherId}`);

    // 2. 备课发布验证 (Unit 88, Lesson 88)
    const testPlan = {
      courseInfo: {
        title: "自动化测试备课",
        date: new Date().toISOString(),
        chinese: { unit: "88", lesson: "88", title: "测试语文课" },
        math: { unit: "88", lesson: "88", title: "测试数学课" },
        english: { unit: "88", title: "Test English" }
      },
      qcTasks: [
        { taskName: "语文 Unit 88-88 过关 NEW", category: "语文", defaultExp: 5 },
        { taskName: "数学 Unit 88-88 过关 NEW", category: "数学", defaultExp: 5 }
      ],
      progress: {
        chinese: { unit: "88", lesson: "88", title: "测试语文课" },
        math: { unit: "88", lesson: "88", title: "测试数学课" },
        english: { unit: "88", title: "Test English" }
      }
    };

    console.log('🔍 发送的请求数据:', JSON.stringify(testPlan, null, 2));
    console.log('📡 正在发布备课计划...');
    const publishRes = await axios.post(`${BASE_URL}/lms/publish`, testPlan, authHeaders);
    console.log('✅ 备课发布结果:', publishRes.data.success ? '成功' : '失败');

    // 3. 检查受影响的学生任务记录
    const studentsRes = await axios.get(`${BASE_URL}/students?scope=MY_STUDENTS&teacherId=${teacherId}`, authHeaders);
    const targetStudent = studentsRes.data.data.students[0];
    if (!targetStudent) throw new Error('未找到学生');

    const today = new Date().toISOString().split('T')[0];
    const recordsRes = await axios.get(`${BASE_URL}/lms/daily-records?studentId=${targetStudent.id}&date=${today}`, authHeaders);
    const qcTask = recordsRes.data.data.find(r => r.type === 'QC' && r.title.includes('88-88 过关 NEW'));

    if (qcTask) {
      console.log('✅ 链路 1 成功：备课发布已生成 QC 记录 (ID: ' + qcTask.id + ')');
      console.log('   记录内容:', JSON.stringify(qcTask.content));
    } else {
      console.error('❌ 链路 1 失败：未找到对应的 QC 记录');
    }

    // 4. 过关页操作模拟：标记为完成
    if (qcTask) {
      console.log(`📡 正在模拟过关操作: ${qcTask.title}`);
      const passRes = await axios.patch(`${BASE_URL}/lms/records/batch/status`, {
        recordIds: [qcTask.id],
        status: 'COMPLETED'
      }, authHeaders);
      console.log('✅ 过关操作结果:', passRes.data.success ? '成功' : '失败');
    }

    // 5. 个人详情页：学期地图汇总验证
    console.log('📡 正在获取学生全量历史记录进行地图汇总验证...');
    const allRecordsRes = await axios.get(`${BASE_URL}/lms/all-records?studentId=${targetStudent.id}&limit=100`, authHeaders);
    const history = allRecordsRes.data.data;

    // 模拟 StudentDetail.tsx 中的聚合逻辑
    const hasInMap = history.some(r => {
      const content = r.content || {};
      return r.type === 'QC' && content.unit === '88' && content.lesson === '88' && r.status === 'COMPLETED';
    });

    if (hasInMap) {
      console.log('✅ 链路 2 成功：过关数据已正确汇总到学期地图聚合源');
    } else {
      console.error('❌ 链路 2 失败：学期地图聚合源中未发现 Unit 88 且状态为 COMPLETED 的数据');
      // 查找相关的记录
      const sample = history.filter(r => r.type === 'QC' && r.title.includes('88'));
      console.log('匹配的 QC 记录详情:', JSON.stringify(sample, null, 2));
    }

  } catch (error) {
    console.error('❌ 验证过程中发生异常:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

verifyFlow();
