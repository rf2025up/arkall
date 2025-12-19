-- 重置所有学生归属：清除teacherId，让所有学生属于学校但无具体班级归属
-- 这样老师就可以通过"抢人"功能将学生分配到自己的班级

UPDATE students
SET "teacherId" = NULL,
    "className" = NULL
WHERE "schoolId" = '625e503b-aa7e-44fe-9982-237d828af717';

-- 验证更新结果
SELECT
    "teacherId",
    "className",
    COUNT(*) as student_count
FROM students
WHERE "schoolId" = '625e503b-aa7e-44fe-9982-237d828af717'
    AND "isActive" = true
GROUP BY "teacherId", "className"
ORDER BY "teacherId" NULLS LAST;