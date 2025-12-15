#!/usr/bin/env node

/**
 * StarJourney 数据库扩展脚本
 *
 * 功能：为StarJourney功能创建数据库表结构
 * 依赖：共享Growark的PostgreSQL数据库
 * 表前缀：lms_ (Learning Management System)
 */

const { Pool } = require('pg');
require('dotenv').config();

// 使用与Growark相同的数据库配置
const {
  DATABASE_URL,
  DB_HOST = 'growark-postgresql.ns-bg6fgs6y.svc',
  DB_PORT = '5432',
  DB_USER = 'postgres',
  DB_PASSWORD = 'kngwb5cb',
  DB_NAME = 'postgres',
} = process.env;

const connectionString = DATABASE_URL ||
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const pool = new Pool({ connectionString });

async function createStarJourneySchema() {
  const client = await pool.connect();

  try {
    console.log('🚀 开始创建StarJourney数据库Schema...\n');

    // ==================== 1. 错题记录表 ====================
    console.log('📋 创建 lms_mistakes 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lms_mistakes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        image_url VARCHAR(500),              -- 错题图片URL
        ocr_text TEXT,                       -- OCR识别的文本
        ai_analysis JSONB,                   -- AI分析结果 (包含setter_logic等)
        subject VARCHAR(50) DEFAULT 'math',  -- 学科 (math, chinese, english)
        status VARCHAR(20) DEFAULT 'pending', -- pending, solved, reviewed
        tags TEXT[],                         -- 知识点标签
        difficulty_level INTEGER DEFAULT 1,   -- 难度等级 1-5
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_lms_mistakes_student_id ON lms_mistakes(student_id);
      CREATE INDEX IF NOT EXISTS idx_lms_mistakes_subject ON lms_mistakes(subject);
      CREATE INDEX IF NOT EXISTS idx_lms_mistakes_status ON lms_mistakes(status);
      CREATE INDEX IF NOT EXISTS idx_lms_mistakes_created_at ON lms_mistakes(created_at);
    `);
    console.log('✅ lms_mistakes 表创建成功\n');

    // ==================== 2. 过关记录表 (核心功能) ====================
    console.log('📋 创建 lms_student_record 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lms_student_record (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        task_name VARCHAR(200) NOT NULL,     -- 任务名称 (如"口算达标")
        task_type VARCHAR(20) NOT NULL,      -- QC (质检) / TASK (过程任务)
        status VARCHAR(20) DEFAULT 'pending', -- pending, passed
        exp_value INTEGER DEFAULT 10,        -- 经验值奖励
        attempt_count INTEGER DEFAULT 0,     -- 尝试次数 (核心！体现服务价值)
        difficulty_flag BOOLEAN DEFAULT FALSE, -- 是否为"硬骨头"任务
        is_special BOOLEAN DEFAULT FALSE,    -- 是否为个性化加餐

        -- 课程进度信息
        lesson_unit INTEGER,                 -- 当前单元
        lesson_lesson INTEGER,               -- 当前课次
        lesson_title VARCHAR(200),           -- 课程标题
        lesson_subject VARCHAR(50),          -- 学科

        -- 时间戳
        first_attempt_at TIMESTAMP,          -- 首次尝试时间
        completed_at TIMESTAMP,              -- 完成时间
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_lms_student_record_student_id ON lms_student_record(student_id);
      CREATE INDEX IF NOT EXISTS idx_lms_student_record_task_type ON lms_student_record(task_type);
      CREATE INDEX IF NOT EXISTS idx_lms_student_record_status ON lms_student_record(status);
      CREATE INDEX IF NOT EXISTS idx_lms_student_record_lesson ON lms_student_record(lesson_subject, lesson_unit);
      CREATE INDEX IF NOT EXISTS idx_lms_student_record_created_at ON lms_student_record(created_at);
    `);
    console.log('✅ lms_student_record 表创建成功\n');

    // ==================== 3. 学情报告表 ====================
    console.log('📋 创建 lms_academic_reports 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lms_academic_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        report_type VARCHAR(20) NOT NULL,     -- weekly, monthly, custom
        start_date DATE NOT NULL,             -- 报告开始日期
        end_date DATE NOT NULL,               -- 报告结束日期

        -- 五维能力雷达图数据
        radar_data JSONB NOT NULL,            -- {calculation: 80, concept: 60, ...}

        -- AI分析结果
        ai_comment TEXT,                      -- AI生成的评语
        total_mistakes INTEGER DEFAULT 0,    -- 错题总数
        weak_points JSONB,                    -- 薄弱知识点分析
        action_plan TEXT[],                  -- 改进建议

        -- 报告文件
        pdf_url VARCHAR(500),                -- 生成的PDF报告链接
        html_content TEXT,                    -- HTML报告内容

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT unique_student_report_period UNIQUE(student_id, report_type, start_date, end_date)
      );

      CREATE INDEX IF NOT EXISTS idx_lms_academic_reports_student_id ON lms_academic_reports(student_id);
      CREATE INDEX IF NOT EXISTS idx_lms_academic_reports_type ON lms_academic_reports(report_type);
      CREATE INDEX IF NOT EXISTS idx_lms_academic_reports_date_range ON lms_academic_reports(start_date, end_date);
    `);
    console.log('✅ lms_academic_reports 表创建成功\n');

    // ==================== 4. 教师备课记录表 ====================
    console.log('📋 创建 lms_lesson_plans 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lms_lesson_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id VARCHAR(100) NOT NULL,     -- 教师标识
        subject VARCHAR(50) NOT NULL,         -- 学科

        -- 课程信息
        unit INTEGER NOT NULL,                -- 单元
        lesson INTEGER NOT NULL,              -- 课次
        title VARCHAR(200) NOT NULL,          -- 课程标题

        -- 备课内容
        qc_items TEXT[],                      -- 质检过关项列表
        task_items TEXT[],                    -- 过程任务列表
        special_tasks JSONB,                  -- 个性化加餐任务

        -- 发布状态
        is_published BOOLEAN DEFAULT FALSE,  -- 是否已发布
        publish_date TIMESTAMP,              -- 发布时间

        -- 统计信息
        total_students INTEGER DEFAULT 0,     -- 学生总数
        qc_completion_rate DECIMAL(5,2) DEFAULT 0,  -- 质检完成率

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT unique_lesson_plan UNIQUE(teacher_id, subject, unit, lesson)
      );

      CREATE INDEX IF NOT EXISTS idx_lms_lesson_plans_teacher ON lms_lesson_plans(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_lms_lesson_plans_subject ON lms_lesson_plans(subject);
      CREATE INDEX IF NOT EXISTS idx_lms_lesson_plans_lesson ON lms_lesson_plans(subject, unit, lesson);
      CREATE INDEX IF NOT EXISTS idx_lms_lesson_plans_published ON lms_lesson_plans(is_published);
    `);
    console.log('✅ lms_lesson_plans 表创建成功\n');

    // ==================== 5. 创建视图和函数 ====================
    console.log('📋 创建辅助视图和函数...');

    // 学生学业统计视图
    await client.query(`
      CREATE OR REPLACE VIEW v_student_academic_stats AS
      SELECT
        s.id as student_id,
        s.name as student_name,
        s.class_name,
        COUNT(DISTINCT CASE WHEN lr.task_type = 'QC' AND lr.status = 'passed' THEN lr.id END) as qc_passed,
        COUNT(DISTINCT CASE WHEN lr.task_type = 'QC' AND lr.status = 'pending' THEN lr.id END) as qc_pending,
        COUNT(DISTINCT CASE WHEN lr.task_type = 'TASK' AND lr.status = 'passed' THEN lr.id END) as task_passed,
        COUNT(DISTINCT CASE WHEN lr.task_type = 'TASK' AND lr.status = 'pending' THEN lr.id END) as task_pending,
        COALESCE(SUM(lr.attempt_count), 0) as total_attempts,
        COALESCE(SUM(lr.exp_value), 0) as total_earned_exp,
        COUNT(DISTINCT m.id) as total_mistakes,
        COUNT(DISTINCT CASE WHEN m.status = 'solved' THEN m.id END) as solved_mistakes
      FROM students s
      LEFT JOIN lms_student_record lr ON s.id = lr.student_id
      LEFT JOIN lms_mistakes m ON s.id = m.student_id
      GROUP BY s.id, s.name, s.class_name;
    `);

    // 更新时间戳函数
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // 为各表添加更新时间戳触发器
    const triggerTables = ['lms_mistakes', 'lms_student_record', 'lms_academic_reports', 'lms_lesson_plans'];
    for (const table of triggerTables) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    console.log('✅ 辅助视图和函数创建成功\n');

    // ==================== 6. 插入初始数据 ====================
    console.log('📋 插入初始测试数据...');

    // 检查是否有现有学生数据
    const studentsResult = await client.query('SELECT id, name FROM students LIMIT 3');
    if (studentsResult.rows.length > 0) {
      const sampleStudent = studentsResult.rows[0];

      // 插入示例过关记录
      await client.query(`
        INSERT INTO lms_student_record (
          student_id, task_name, task_type, status, exp_value,
          lesson_unit, lesson_lesson, lesson_title, lesson_subject
        ) VALUES
          ($1, '口算达标', 'QC', 'passed', 20, 1, 1, '100以内加减法', 'math'),
          ($1, '课文背诵', 'QC', 'pending', 15, 1, 1, '古诗二首', 'chinese'),
          ($1, '错题订正', 'TASK', 'passed', 10, 1, 1, '练习册订正', 'math')
        ON CONFLICT DO NOTHING;
      `, [sampleStudent.id]);

      // 插入示例错题记录
      await client.query(`
        INSERT INTO lms_mistakes (
          student_id, ocr_text, subject, status, tags
        ) VALUES
          ($1, '25 + 17 = 32（错误）', 'math', 'pending', ARRAY['加法计算', '进位']),
          ($1, '古诗背诵错误', 'chinese', 'solved', ARRAY['古诗', '背诵'])
        ON CONFLICT DO NOTHING;
      `, [sampleStudent.id]);

      console.log(`  ✅ 为学生 ${sampleStudent.name} 插入测试数据成功`);
    }

    // ==================== 7. 验证数据结构 ====================
    console.log('📊 验证数据库结构...');

    const schemaTables = [
      'lms_mistakes',
      'lms_student_record',
      'lms_academic_reports',
      'lms_lesson_plans',
      'v_student_academic_stats'
    ];

    for (const table of schemaTables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result.rows[0].count;
      console.log(`  📊 ${table}: ${count} 行`);
    }

    // 测试外键约束
    console.log('\n🔍 测试数据完整性...');
    try {
      await client.query(`
        INSERT INTO lms_student_record (student_id, task_name, task_type)
        VALUES (99999, 'test', 'QC')
      `);
      console.log('  ❌ 外键约束测试失败：应该阻止无效student_id');
    } catch (error) {
      if (error.message.includes('violates foreign key constraint')) {
        console.log('  ✅ 外键约束测试通过：正确阻止无效数据');
      } else {
        console.log('  ⚠️  外键约束测试异常：', error.message);
      }
    }

    console.log('\n✨ StarJourney数据库Schema创建完成！\n');

    console.log('📋 创建的表和视图:');
    console.log('  1. lms_mistakes - 错题记录表');
    console.log('  2. lms_student_record - 过关记录表 (核心功能)');
    console.log('  3. lms_academic_reports - 学情报告表');
    console.log('  4. lms_lesson_plans - 教师备课记录表');
    console.log('  5. v_student_academic_stats - 学生学业统计视图');

    console.log('\n🚀 下一步: 启动StarJourney服务器');
    console.log('   node star-server.js\n');

  } catch (error) {
    console.error('❌ 创建Schema失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

// 执行数据库扩展
console.log('StarJourney 数据库扩展开始...');
createStarJourneySchema()
  .then(() => {
    console.log('🎉 StarJourney数据库扩展成功完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 StarJourney数据库扩展失败:', error);
    process.exit(1);
  });