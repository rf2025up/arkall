-- 创建测试学生数据
INSERT INTO schools (id, name, created_at, updated_at) VALUES 
('test-school-id', '测试学校', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;

-- 创建测试老师
INSERT INTO teachers (id, username, password, full_name, role, school_id, created_at, updated_at) VALUES 
('test-teacher-id', 'teacher', 'password', '测试老师', 'TEACHER', 'test-school-id', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 创建测试学生
INSERT INTO students (id, name, student_id, teacher_id, school_id, points, exp, is_active, created_at, updated_at) VALUES 
('67346e52-b970-41cc-9711-de08830b5f4f', '测试学生', 'STU001', 'test-teacher-id', 'test-school-id', 100, 50, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
