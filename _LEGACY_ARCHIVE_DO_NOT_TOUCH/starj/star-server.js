#!/usr/bin/env node

/**
 * StarJourney 独立服务器
 *
 * 功能：为StarJourney功能提供独立的API服务器
 * 端口：3001 (避免与Growark的3000端口冲突)
 * 数据库：共享Growark的PostgreSQL数据库
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Pool } = require('pg');
require('dotenv').config();

// 数据库配置 (与Growark共享)
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

// 服务器配置
const PORT = process.env.STAR_PORT || 3001;
const app = express();
const server = http.createServer(app);

// 中间件配置
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/star-demo.html', express.static(path.join(__dirname, 'star-demo.html')));
app.use('/star-static', express.static(path.join(__dirname, 'star-static')));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message
  });
});

// ================ API路由 ================

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.json({
      success: true,
      message: 'StarJourney服务器运行正常',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '数据库连接失败',
      message: error.message
    });
  }
});

// ==================== 错题管理API ====================

// 获取错题列表
app.get('/api/mistakes', async (req, res) => {
  try {
    const { student_id, subject, status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT m.*, s.name as student_name, s.class_name
      FROM lms_mistakes m
      JOIN students s ON m.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (student_id) {
      query += ` AND m.student_id = $${paramIndex++}`;
      params.push(student_id);
    }
    if (subject) {
      query += ` AND m.subject = $${paramIndex++}`;
      params.push(subject);
    }
    if (status) {
      query += ` AND m.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('获取错题列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取错题列表失败',
      message: error.message
    });
  }
});

// 创建错题记录
app.post('/api/mistakes', async (req, res) => {
  try {
    const {
      student_id,
      image_url,
      ocr_text,
      subject = 'math',
      tags,
      difficulty_level = 1
    } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：student_id'
      });
    }

    const result = await pool.query(`
      INSERT INTO lms_mistakes (student_id, image_url, ocr_text, subject, tags, difficulty_level)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [student_id, image_url, ocr_text, subject, tags, difficulty_level]);

    res.json({
      success: true,
      data: result.rows[0],
      message: '错题记录创建成功'
    });
  } catch (error) {
    console.error('创建错题记录失败:', error);
    res.status(500).json({
      success: false,
      error: '创建错题记录失败',
      message: error.message
    });
  }
});

// 更新错题记录
app.put('/api/mistakes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ai_analysis, tags } = req.body;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(status);
    }
    if (ai_analysis !== undefined) {
      updateFields.push(`ai_analysis = $${paramIndex++}`);
      updateValues.push(ai_analysis);
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      updateValues.push(tags);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有要更新的字段'
      });
    }

    updateValues.push(id);

    const result = await pool.query(`
      UPDATE lms_mistakes
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '错题记录不存在'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: '错题记录更新成功'
    });
  } catch (error) {
    console.error('更新错题记录失败:', error);
    res.status(500).json({
      success: false,
      error: '更新错题记录失败',
      message: error.message
    });
  }
});

// 删除错题记录
app.delete('/api/mistakes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM lms_mistakes WHERE id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '错题记录不存在'
      });
    }

    res.json({
      success: true,
      message: '错题记录删除成功'
    });
  } catch (error) {
    console.error('删除错题记录失败:', error);
    res.status(500).json({
      success: false,
      error: '删除错题记录失败',
      message: error.message
    });
  }
});

// ==================== 过关管理API ====================

// 获取过关记录
app.get('/api/records', async (req, res) => {
  try {
    const { student_id, task_type, status, lesson_subject } = req.query;

    let query = `
      SELECT r.*, s.name as student_name, s.class_name
      FROM lms_student_record r
      JOIN students s ON r.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (student_id) {
      query += ` AND r.student_id = $${paramIndex++}`;
      params.push(student_id);
    }
    if (task_type) {
      query += ` AND r.task_type = $${paramIndex++}`;
      params.push(task_type);
    }
    if (status) {
      query += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }
    if (lesson_subject) {
      query += ` AND r.lesson_subject = $${paramIndex++}`;
      params.push(lesson_subject);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('获取过关记录失败:', error);
    res.status(500).json({
      success: false,
      error: '获取过关记录失败',
      message: error.message
    });
  }
});

// 创建过关记录
app.post('/api/records', async (req, res) => {
  try {
    const {
      student_id,
      task_name,
      task_type,
      exp_value = 10,
      lesson_unit,
      lesson_lesson,
      lesson_title,
      lesson_subject,
      is_special = false
    } = req.body;

    if (!student_id || !task_name || !task_type) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：student_id, task_name, task_type'
      });
    }

    const result = await pool.query(`
      INSERT INTO lms_student_record (
        student_id, task_name, task_type, exp_value,
        lesson_unit, lesson_lesson, lesson_title, lesson_subject,
        is_special, first_attempt_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *
    `, [student_id, task_name, task_type, exp_value, lesson_unit, lesson_lesson, lesson_title, lesson_subject, is_special]);

    res.json({
      success: true,
      data: result.rows[0],
      message: '过关记录创建成功'
    });
  } catch (error) {
    console.error('创建过关记录失败:', error);
    res.status(500).json({
      success: false,
      error: '创建过关记录失败',
      message: error.message
    });
  }
});

// 记录辅导尝试 (核心功能！)
app.patch('/api/records/:id/attempt', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE lms_student_record
      SET attempt_count = attempt_count + 1,
          first_attempt_at = COALESCE(first_attempt_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status != 'passed'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '过关记录不存在或已通过'
      });
    }

    const record = result.rows[0];
    console.log(`🔥 记录辅导尝试: 学生${record.student_id}, 任务${record.task_name}, 尝试次数${record.attempt_count}`);

    res.json({
      success: true,
      data: record,
      message: `辅导尝试记录成功，当前尝试次数：${record.attempt_count}`
    });
  } catch (error) {
    console.error('记录辅导尝试失败:', error);
    res.status(500).json({
      success: false,
      error: '记录辅导尝试失败',
      message: error.message
    });
  }
});

// 标记为通过
app.patch('/api/records/:id/pass', async (req, res) => {
  try {
    const { id } = req.params;
    const exp_bonus = req.body && req.body.exp_bonus !== undefined ? req.body.exp_bonus : 0;

    const result = await pool.query(`
      UPDATE lms_student_record
      SET status = 'passed',
          completed_at = CURRENT_TIMESTAMP,
          difficulty_flag = CASE WHEN attempt_count > 2 THEN true ELSE difficulty_flag END,
          exp_value = exp_value + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status != 'passed'
      RETURNING *
    `, [exp_bonus, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '过关记录不存在或已通过'
      });
    }

    const record = result.rows[0];

    // 如果尝试次数多，标记为困难任务
    if (record.attempt_count > 2) {
      console.log(`🏆 任务攻克: 学生${record.student_id}, 任务${record.task_name}, 经过${record.attempt_count}次尝试才通过`);
    }

    // 同步更新学生经验值 (可选，这里记录但不实际操作)
    console.log(`💰 经验值奖励: +${record.exp_value} exp (学生${record.student_id})`);

    res.json({
      success: true,
      data: record,
      message: `任务通过成功！获得${record.exp_value}经验值，尝试次数：${record.attempt_count}`
    });
  } catch (error) {
    console.error('标记通过失败:', error);
    res.status(500).json({
      success: false,
      error: '标记通过失败',
      message: error.message
    });
  }
});

// 删除过关记录
app.delete('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM lms_student_record WHERE id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '过关记录不存在'
      });
    }

    res.json({
      success: true,
      message: '过关记录删除成功'
    });
  } catch (error) {
    console.error('删除过关记录失败:', error);
    res.status(500).json({
      success: false,
      error: '删除过关记录失败',
      message: error.message
    });
  }
});

// 批量标记学生所有QC任务为通过
app.patch('/api/records/student/:studentId/pass-all', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { expBonus = 0 } = req.body;

    const result = await pool.query(`
      UPDATE lms_student_record
      SET status = 'passed',
          completed_at = CURRENT_TIMESTAMP,
          difficulty_flag = CASE WHEN attempt_count > 2 THEN true ELSE difficulty_flag END,
          exp_value = exp_value + $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE student_id = $1 AND task_type = 'QC' AND status != 'passed'
      RETURNING *
    `, [studentId, expBonus]);

    res.json({
      success: true,
      data: result.rows,
      message: `一键过关成功！共通过${result.rows.length}个QC任务`
    });
  } catch (error) {
    console.error('一键过关失败:', error);
    res.status(500).json({
      success: false,
      error: '一键过关失败',
      message: error.message
    });
  }
});

// 批量创建多个任务记录
app.post('/api/records/batch', async (req, res) => {
  try {
    const { records } = req.body; // [{student_id, task_name, task_type, exp_value, ...}, ...]

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的任务记录数组'
      });
    }

    const result = await pool.query(`
      INSERT INTO lms_student_record (
        student_id, task_name, task_type, exp_value,
        lesson_unit, lesson_lesson, lesson_title, lesson_subject,
        is_special, first_attempt_at
      ) VALUES ${records.map((_, index) =>
        `($${index * 12 + 1}, $${index * 12 + 2}, $${index * 12 + 3}, $${index * 12 + 4}, $${index * 12 + 5}, $${index * 12 + 6}, $${index * 12 + 7}, $${index * 12 + 8}, $${index * 12 + 9}, CURRENT_TIMESTAMP)`
      ).join(', ')}
      RETURNING *
    `, records.flatMap(r => [r.student_id, r.task_name, r.task_type, r.exp_value, r.lesson_unit, r.lesson_lesson, r.lesson_title, r.lesson_subject, r.is_special]));

    res.json({
      success: true,
      data: result.rows,
      message: `批量创建成功！共创建${result.rows.length}个任务记录`
    });
  } catch (error) {
    console.error('批量创建任务失败:', error);
    res.status(500).json({
      success: false,
      error: '批量创建任务失败',
      message: error.message
    });
  }
});

// ==================== 任务库API ====================

// 获取任务库
app.get('/api/meta/tasks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        category,
        name,
        default_exp,
        is_active,
        sort_order
      FROM lms_task_library
      WHERE is_active = true
      ORDER BY sort_order ASC, category ASC, name ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('获取任务库失败:', error);
    res.status(500).json({
      success: false,
      error: '获取任务库失败',
      message: error.message
    });
  }
});

// ==================== LMS备课API ====================

// 发布备课计划
app.post('/api/plans/publish', async (req, res) => {
  try {
    const {
      teacher_id,
      title,
      course_info,
      qc_config,
      tasks,
      special_tasks = []
    } = req.body;

    // 生成批次ID
    const batch_id = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 开始事务
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. 创建备课计划
      const planResult = await client.query(`
        INSERT INTO lms_lesson_plans (
          teacher_id, title, subject, unit, lesson, course_progress, qc_config,
          is_published, publish_date, batch_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_DATE, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [teacher_id, title, '综合', 1, 1, JSON.stringify(course_info), JSON.stringify(qc_config), batch_id]);

      const plan = planResult.rows[0];

      // 2. 获取班级学生列表
      const studentsResult = await client.query(`
        SELECT id, name, class_name
        FROM students
        WHERE teacher_id = $1
      `, [teacher_id]);

      const students = studentsResult.rows;
      let totalRecords = 0;
      let specialTaskCount = 0;

      // 3. Fan-out: 为每个学生创建任务记录
      for (const student of students) {
        // 创建QC任务记录
        for (const [subject, qcItems] of Object.entries(qc_config || {})) {
          for (const qcItem of qcItems) {
            await client.query(`
              INSERT INTO lms_student_record (
                plan_id, batch_id, student_id, task_name, task_category,
                task_type, exp_value, status,
                lesson_unit, lesson_lesson, lesson_title, lesson_subject,
                is_special, created_at
              ) VALUES ($1, $2, $3, $4, 'QC', 'qc', 10, 'pending',
                       $5, $6, $7, $8, false, CURRENT_TIMESTAMP)
            `, [
              plan.id, batch_id, student.id, qcItem,
              course_info[subject]?.unit || '',
              course_info[subject]?.lesson || null,
              course_info[subject]?.title || '',
              subject
            ]);
            totalRecords++;
          }
        }

        // 创建通用任务记录
        for (const taskName of tasks || []) {
          // 获取任务经验值
          const taskResult = await client.query(`
            SELECT default_exp FROM lms_task_library WHERE name = $1
          `, [taskName]);

          const expValue = taskResult.rows[0]?.default_exp || 10;

          await client.query(`
            INSERT INTO lms_student_record (
              plan_id, batch_id, student_id, task_name, task_category,
              task_type, exp_value, status,
              lesson_unit, lesson_lesson, lesson_title, lesson_subject,
              is_special, created_at
            ) VALUES ($1, $2, $3, $4, 'TASK', 'task', $5, 'pending',
                     $6, $7, $8, $9, false, CURRENT_TIMESTAMP)
          `, [
            plan.id, batch_id, student.id, taskName, expValue,
            course_info.chinese?.unit || '',
            course_info.chinese?.lesson || null,
            course_info.chinese?.title || '',
            'chinese'
          ]);
          totalRecords++;
        }

        // 创建个性化任务记录
        for (const specialTask of special_tasks || []) {
          if (specialTask.students.includes(student.name)) {
            for (const taskName of specialTask.tasks || []) {
              await client.query(`
                INSERT INTO lms_student_record (
                  plan_id, batch_id, student_id, task_name, task_category,
                  task_type, exp_value, status,
                  lesson_unit, lesson_lesson, lesson_title, lesson_subject,
                  is_special, created_at
                ) VALUES ($1, $2, $3, $4, 'SPECIAL', 'special', 30, 'pending',
                         $5, $6, $7, $8, true, CURRENT_TIMESTAMP)
              `, [
                plan.id, batch_id, student.id, taskName,
                course_info.chinese?.unit || '',
                course_info.chinese?.lesson || null,
                course_info.chinese?.title || '',
                'chinese'
              ]);
              totalRecords++;
              specialTaskCount++;
            }
          }
        }
      }

      // 4. 更新计划统计信息
      await client.query(`
        UPDATE lms_lesson_plans
        SET total_students = $1, total_records = $2
        WHERE id = $3
      `, [students.length, totalRecords, plan.id]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: '备课计划发布成功',
        data: {
          plan_id: plan.id,
          batch_id: batch_id,
          created_records: totalRecords,
          affected_students: students.length,
          special_task_count: specialTaskCount,
          estimated_total_exp: totalRecords * 15 // 估算经验值
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('发布备课计划失败:', error);
    res.status(500).json({
      success: false,
      error: '发布备课计划失败',
      message: error.message
    });
  }
});

// 获取今日备课计划
app.get('/api/plans/today', async (req, res) => {
  try {
    const { teacher_id, publish_date } = req.query;

    let query = `
      SELECT * FROM lms_lesson_plans
      WHERE is_published = true
    `;
    const params = [];
    let paramIndex = 1;

    if (teacher_id) {
      query += ` AND teacher_id = $${paramIndex++}`;
      params.push(teacher_id);
    }

    if (publish_date) {
      query += ` AND publish_date = $${paramIndex++}`;
      params.push(publish_date);
    } else {
      query += ` AND publish_date = CURRENT_DATE`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('获取今日备课计划失败:', error);
    res.status(500).json({
      success: false,
      error: '获取今日备课计划失败',
      message: error.message
    });
  }
});

// 获取学生学业地图
app.get('/api/students/:student_id/academic-map', async (req, res) => {
  try {
    const { student_id } = req.params;

    // 获取学生基本信息
    const studentResult = await pool.query(`
      SELECT id, name, class_name, teacher_id, current_grade_level, individual_progress
      FROM students WHERE id = $1
    `, [student_id]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '学生不存在'
      });
    }

    const student = studentResult.rows[0];

    // 获取当前进度
    let current_progress = {};
    if (student.individual_progress) {
      current_progress = student.individual_progress;
    } else {
      // 获取最新班级进度
      const progressResult = await pool.query(`
        SELECT course_progress
        FROM lms_lesson_plans
        WHERE is_published = true
        ORDER BY publish_date DESC
        LIMIT 1
      `);

      if (progressResult.rows.length > 0) {
        current_progress = progressResult.rows[0].course_progress;
      }
    }

    // 获取任务记录
    const recordsResult = await pool.query(`
      SELECT * FROM lms_student_record
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `, [student_id]);

    // 构建学业地图
    const academic_map = [];
    const task_history = [];

    // 处理任务记录
    recordsResult.rows.forEach(record => {
      if (record.status === 'completed' && record.completed_at) {
        task_history.push({
          date: record.completed_at,
          category: record.task_category,
          task_name: record.task_name,
          exp_awarded: record.exp_awarded,
          completed_at: record.completed_at
        });
      }
    });

    res.json({
      success: true,
      data: {
        student_info: {
          id: student.id,
          name: student.name,
          class_name: student.class_name,
          teacher_id: student.teacher_id,
          current_grade_level: student.current_grade_level
        },
        current_progress: current_progress,
        academic_map: academic_map,
        task_history: task_history
      }
    });

  } catch (error) {
    console.error('获取学生学业地图失败:', error);
    res.status(500).json({
      success: false,
      error: '获取学生学业地图失败',
      message: error.message
    });
  }
});

// ==================== 学情统计API ====================

// 获取学生学业统计
app.get('/api/student-stats/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;

    const result = await pool.query(`
      SELECT * FROM v_student_academic_stats
      WHERE student_id = $1
    `, [student_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '学生不存在或无统计数据'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('获取学生统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取学生统计失败',
      message: error.message
    });
  }
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StarJourney服务器启动成功！`);
  console.log(`📍 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`🌐 测试页面: http://localhost:${PORT}/star-demo.html`);
  console.log(`❤️ 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📊 API接口: http://localhost:${PORT}/api/*`);
  console.log('');
  console.log('📋 可用API:');
  console.log('  GET  /api/health              - 健康检查');
  console.log('  GET  /api/mistakes            - 获取错题列表');
  console.log('  POST /api/mistakes            - 创建错题记录');
  console.log('  PUT  /api/mistakes/:id        - 更新错题记录');
  console.log('  GET  /api/records             - 获取过关记录');
  console.log('  POST /api/records             - 创建过关记录');
  console.log('  PATCH /api/records/:id/attempt - 记录辅导尝试');
  console.log('  PATCH /api/records/:id/pass    - 标记为通过');
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    pool.end();
    console.log('StarJourney服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    pool.end();
    console.log('StarJourney服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;