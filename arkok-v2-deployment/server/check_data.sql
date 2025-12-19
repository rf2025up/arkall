-- 查看当前数据状态
SELECT
  'students' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN "teacherId" IS NOT NULL THEN 1 END) as with_teacher,
  COUNT(CASE WHEN "teacherId" IS NULL THEN 1 END) as without_teacher
FROM "Student"
WHERE "schoolId" = '625e503b-aa7e-44fe-9982-237d828af717'

UNION ALL

SELECT
  'task_records' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN "taskCategory" = 'PROGRESS' THEN 1 END) as progress_tasks,
  COUNT(CASE WHEN "taskCategory" != 'PROGRESS' THEN 1 END) as other_tasks
FROM "TaskRecord"
WHERE "schoolId" = '625e503b-aa7e-44fe-9982-237d828af717'

UNION ALL

SELECT
  'lesson_plans' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_plans,
  COUNT(CASE WHEN "isActive" = false THEN 1 END) as inactive_plans
FROM "LessonPlan"
WHERE "schoolId" = '625e503b-aa7e-44fe-9982-237d828af717';