-- 文件: database/migrations/002_upgrade_lms_tables.sql
-- 目的: 升级LMS相关表结构，支持三科差异化进度和任务分类
-- 执行时间: 2025-12-11

-- ==================== 1. 升级 lms_lesson_plans 表 ====================
ALTER TABLE lms_lesson_plans
ADD COLUMN IF NOT EXISTS course_progress JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS qc_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS publish_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100) DEFAULT NULL;

-- 为现有数据迁移：将现有字段迁移到新的JSON结构
DO $$
BEGIN
    -- 如果字段存在且有数据，进行数据迁移
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='lms_lesson_plans' AND column_name='unit') THEN

        -- 迁移现有数据到 course_progress JSON结构
        UPDATE lms_lesson_plans
        SET course_progress = jsonb_build_object(
            LOWER(subject),
            jsonb_build_object(
                'unit', unit,
                'lesson', lesson,
                'title', title
            )
        )
        WHERE unit IS NOT NULL AND subject IS NOT NULL;

        -- 迁移现有QC配置到 qc_config JSON结构
        UPDATE lms_lesson_plans
        SET qc_config = CASE
            WHEN subject = 'chinese' AND qc_items IS NOT NULL THEN
                jsonb_build_object('chinese', qc_items)
            WHEN subject = 'math' AND qc_items IS NOT NULL THEN
                jsonb_build_object('math', qc_items)
            WHEN subject = 'english' AND qc_items IS NOT NULL THEN
                jsonb_build_object('english', qc_items)
            ELSE '{}'
        END
        WHERE qc_items IS NOT NULL AND subject IS NOT NULL;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_lms_lesson_plans_publish_date ON lms_lesson_plans(publish_date);
CREATE INDEX IF NOT EXISTS idx_lms_lesson_plans_course_progress ON lms_lesson_plans USING GIN(course_progress);
CREATE INDEX IF NOT EXISTS idx_lms_lesson_plans_qc_config ON lms_lesson_plans USING GIN(qc_config);
CREATE INDEX IF NOT EXISTS idx_lms_lesson_plans_batch_id ON lms_lesson_plans(batch_id);

-- ==================== 2. 升级 lms_student_record 表 ====================
ALTER TABLE lms_student_record
ADD COLUMN IF NOT EXISTS task_category VARCHAR(20) DEFAULT 'TASK' CHECK (task_category IN ('QC', 'TASK', 'SPECIAL')),
ADD COLUMN IF NOT EXISTS exp_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES lms_lesson_plans(id) ON DELETE CASCADE;

-- 数据迁移：根据现有task_type字段设置task_category
DO $$
BEGIN
    -- 检查task_type字段是否存在
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='lms_student_record' AND column_name='task_type') THEN

        -- 迁移task_type到task_category
        UPDATE lms_student_record
        SET task_category = CASE
            WHEN UPPER(task_type) = 'QC' THEN 'QC'
            WHEN UPPER(task_type) = 'TASK' THEN 'TASK'
            WHEN task_type IS NULL THEN 'TASK'  -- 默认为TASK
            ELSE 'TASK'
        END;

        -- 设置is_special字段
        UPDATE lms_student_record
        SET is_special = CASE
            WHEN lesson_subject IS NOT NULL AND lesson_subject LIKE '%特殊%' THEN TRUE
            WHEN task_name LIKE '%特殊%' OR task_name LIKE '%加餐%' THEN TRUE
            ELSE FALSE
        END;

        -- 设置exp_awarded字段
        UPDATE lms_student_record
        SET exp_awarded = COALESCE(exp_value, 10);
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_lms_student_record_task_category ON lms_student_record(task_category);
CREATE INDEX IF NOT EXISTS idx_lms_student_record_is_special ON lms_student_record(is_special);
CREATE INDEX IF NOT EXISTS idx_lms_student_record_plan_id ON lms_student_record(plan_id);
CREATE INDEX IF NOT EXISTS idx_lms_student_record_batch_id ON lms_student_record(batch_id);
CREATE INDEX IF NOT EXISTS idx_lms_student_record_completed_at ON lms_student_record(completed_at);

-- ==================== 3. 升级 students 表 ====================
ALTER TABLE students
ADD COLUMN IF NOT EXISTS individual_progress JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(100) DEFAULT 'default_teacher',
ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_grade_level INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS daily_task_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_completed_count INTEGER DEFAULT 0;

-- 设置默认教师ID（如果有班级信息的话）
DO $$
BEGIN
    -- 如果有class_name但没有teacher_id，设置默认teacher
    UPDATE students
    SET teacher_id = 'teacher_' || class_name
    WHERE teacher_id = 'default_teacher' AND class_name IS NOT NULL;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_individual_progress ON students USING GIN(individual_progress);
CREATE INDEX IF NOT EXISTS idx_students_current_grade ON students(current_grade_level);

-- ==================== 4. 数据完整性检查 ====================

-- 检查数据迁移结果
DO $$
DECLARE
    lesson_plans_count INTEGER;
    student_records_count INTEGER;
    students_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO lesson_plans_count FROM lms_lesson_plans;
    SELECT COUNT(*) INTO student_records_count FROM lms_student_record;
    SELECT COUNT(*) INTO students_count FROM students;

    RAISE NOTICE '数据迁移完成统计:';
    RAISE NOTICE '  lms_lesson_plans: % 条记录', lesson_plans_count;
    RAISE NOTICE '  lms_student_record: % 条记录', student_records_count;
    RAISE NOTICE '  students: % 条记录', students_count;

    -- 检查关键字段是否有空值
    PERFORM (
        SELECT '检查 lms_lesson_plans.course_progress 空值: ' || COUNT(*)
        FROM lms_lesson_plans WHERE course_progress = '{}'
    );

    PERFORM (
        SELECT '检查 lms_student_record.task_category 空值: ' || COUNT(*)
        FROM lms_student_record WHERE task_category IS NULL
    );

    PERFORM (
        SELECT '检查 students.individual_progress 空值: ' || COUNT(*)
        FROM students WHERE individual_progress = '{}'
    );
END $$;

-- ==================== 5. 添加约束 ====================

-- 添加检查约束确保JSON结构正确
ALTER TABLE lms_lesson_plans
ADD CONSTRAINT IF NOT EXISTS check_course_progress
CHECK (jsonb_typeof(course_progress) = 'object' OR course_progress = '{}');

ALTER TABLE lms_lesson_plans
ADD CONSTRAINT IF NOT EXISTS check_qc_config
CHECK (jsonb_typeof(qc_config) = 'object' OR qc_config = '{}');

ALTER TABLE students
ADD CONSTRAINT IF NOT EXISTS check_individual_progress
CHECK (jsonb_typeof(individual_progress) = 'object' OR individual_progress = '{}');

-- ==================== 6. 更新注释 ====================
COMMENT ON COLUMN lms_lesson_plans.course_progress IS '课程进度JSON：{chinese:{unit,lesson,title},math:{...},english:{...}}';
COMMENT ON COLUMN lms_lesson_plans.qc_config IS 'QC配置JSON：{chinese:[...],math:[...],english:[...]}';
COMMENT ON COLUMN lms_lesson_plans.publish_date IS '发布日期：用于按日期索引和查询';
COMMENT ON COLUMN lms_lesson_plans.batch_id IS '批次ID：用于关联同批次发布的记录';

COMMENT ON COLUMN lms_student_record.task_category IS '任务分类：QC(质检)/TASK(任务)/SPECIAL(个性化)';
COMMENT ON COLUMN lms_student_record.exp_awarded IS '已奖励经验值：任务完成时实际获得的经验值';
COMMENT ON COLUMN lms_student_record.is_special IS '是否个性化：是否为个性化定制任务';
COMMENT ON COLUMN lms_student_record.completed_at IS '完成时间：任务完成的具体时间戳';
COMMENT ON COLUMN lms_student_record.plan_id IS '关联备课计划ID：外键关联到lms_lesson_plans';
COMMENT ON COLUMN lms_student_record.batch_id IS '批次ID：用于批量操作追踪';

COMMENT ON COLUMN students.individual_progress IS '个人进度JSON：{chinese:{unit,lesson,title,is_override},...}';
COMMENT ON COLUMN students.teacher_id IS '教师ID：归属教师标识';
COMMENT ON COLUMN students.class_id IS '班级ID：外键关联groups表';
COMMENT ON COLUMN students.current_grade_level IS '当前年级：用于学业进度管理';
COMMENT ON COLUMN students.daily_task_count IS '今日任务总数：统计用途';
COMMENT ON COLUMN students.daily_completed_count IS '今日完成任务数：统计用途';

-- 创建视图：学生学业进度概览
CREATE OR REPLACE VIEW v_student_progress_overview AS
SELECT
    s.id as student_id,
    s.name as student_name,
    s.class_name,
    s.teacher_id,
    s.current_grade_level,
    COUNT(DISTINCT CASE WHEN sr.task_category = 'QC' AND sr.status = 'passed' THEN sr.id END) as qc_passed,
    COUNT(DISTINCT CASE WHEN sr.task_category = 'QC' AND sr.status = 'pending' THEN sr.id END) as qc_pending,
    COUNT(DISTINCT CASE WHEN sr.task_category = 'TASK' AND sr.status = 'passed' THEN sr.id END) as task_passed,
    COUNT(DISTINCT CASE WHEN sr.task_category = 'TASK' AND sr.status = 'pending' THEN sr.id END) as task_pending,
    COUNT(DISTINCT CASE WHEN sr.task_category = 'SPECIAL' AND sr.status = 'passed' THEN sr.id END) as special_passed,
    COALESCE(SUM(sr.exp_awarded), 0) as total_exp_earned,
    s.daily_task_count,
    s.daily_completed_count
FROM students s
LEFT JOIN lms_student_record sr ON s.id = sr.student_id
GROUP BY s.id, s.name, s.class_name, s.teacher_id, s.current_grade_level, s.daily_task_count, s.daily_completed_count;

COMMENT ON VIEW v_student_progress_overview IS '学生学业进度概览视图：提供学生的任务完成情况统计';

RAISE NOTICE 'LMS表升级完成！';
RAISE NOTICE '下一步：请运行数据完整性验证脚本';