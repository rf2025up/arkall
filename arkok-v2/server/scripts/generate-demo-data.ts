/**
 * 演示数据生成脚本
 * 运行方式: npx ts-node scripts/generate-demo-data.ts
 * 
 * 功能:
 * 1. 将"测试学校"重命名为"演示学校"
 * 2. 创建 2 个老师 + 1 个管理员
 * 3. 创建 2 个班级，每班 5 个学生
 * 4. 为学生生成习惯打卡、PK、挑战、荣誉、阅读、学习过关数据
 * 5. 创建家长账号并绑定学生
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

// 随机选择数组元素
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// 生成随机日期（过去 N 天内）
const randomDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);
    return date;
};

// 学生姓名
const STUDENT_NAMES = [
    '李明轩', '王子涵', '张雨萱', '刘梓萌', '陈思睿',
    '杨雨欣', '赵子豪', '周欣怡', '吴宇航', '郑佳琪'
];

// 习惯名称
const HABIT_NAMES = ['晨读打卡', '课后复习', '错题重练', '口算练习', '英语朗读', '数学思维'];

// 书籍
const BOOKS = [
    { name: '小王子', totalPages: 120 },
    { name: '夏洛的网', totalPages: 180 },
    { name: '窗边的小豆豆', totalPages: 200 },
    { name: '鲁滨逊漂流记', totalPages: 250 },
];

// 勋章配置
const BADGES = [
    { name: '阅读达人', icon: '📚', category: '阅读', description: '坚持阅读30天' },
    { name: '习惯之星', icon: '⭐', category: '习惯', description: '连续打卡7天' },
    { name: 'PK王者', icon: '🏆', category: 'PK', description: '赢得10场PK' },
    { name: '学霸', icon: '🎓', category: '学业', description: '完成所有基础过关' },
    { name: '坚持不懈', icon: '💪', category: '成长', description: '累计学习100小时' },
];

async function main() {
    console.log('🚀 开始生成演示数据...\n');

    // 1. 查找测试学校并重命名
    console.log('📌 Step 1: 查找并重命名测试学校...');
    let school = await prisma.schools.findFirst({
        where: { OR: [{ name: { contains: '测试' } }, { name: { contains: 'Test' } }] }
    });

    if (!school) {
        // 如果没有测试学校，创建一个
        school = await prisma.schools.create({
            data: {
                name: '演示学校',
                planType: 'PRO',
                isActive: true,
                educationalPhilosophy: '欢迎来到演示学校！我们致力于为每一位学生提供个性化的教育体验。'
            }
        });
        console.log(`   ✅ 创建新学校: ${school.name} (ID: ${school.id})`);
    } else {
        // 重命名
        school = await prisma.schools.update({
            where: { id: school.id },
            data: { name: '演示学校' }
        });
        console.log(`   ✅ 学校重命名为: ${school.name} (ID: ${school.id})`);
    }

    const schoolId = school.id;

    // 2. 创建/更新管理员 + 教师账号
    console.log('\n📌 Step 2: 创建管理员和教师账号...');
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 管理员
    const admin = await prisma.teachers.upsert({
        where: { username: 'demo1' },
        update: { name: '演示校长', schoolId },
        create: {
            username: 'demo1',
            password: hashedPassword,
            name: '演示校长',
            role: 'ADMIN',
            schoolId
        }
    });
    console.log(`   ✅ 管理员: ${admin.name} (用户名: demo1, 密码: 123456)`);

    // 教师1
    const teacher1 = await prisma.teachers.upsert({
        where: { username: 'demo2' },
        update: { name: '张老师', schoolId },
        create: {
            username: 'demo2',
            password: hashedPassword,
            name: '张老师',
            role: 'TEACHER',
            schoolId
        }
    });
    console.log(`   ✅ 教师1: ${teacher1.name} (用户名: demo2, 密码: 123456)`);

    // 教师2
    const teacher2 = await prisma.teachers.upsert({
        where: { username: 'demo3' },
        update: { name: '李老师', schoolId },
        create: {
            username: 'demo3',
            password: hashedPassword,
            name: '李老师',
            role: 'TEACHER',
            schoolId
        }
    });
    console.log(`   ✅ 教师2: ${teacher2.name} (用户名: demo3, 密码: 123456)`);

    // 3. 创建习惯
    console.log('\n📌 Step 3: 创建习惯项...');
    const habits: any[] = [];
    for (const name of HABIT_NAMES) {
        const habit = await prisma.habits.upsert({
            where: { schoolId_name: { schoolId, name } },
            update: {},
            create: {
                schoolId,
                name,
                description: `每日${name}`,
                icon: '🎯',
                expReward: randomInt(5, 15),
                pointsReward: randomInt(1, 5)
            }
        });
        habits.push(habit);
    }
    console.log(`   ✅ 创建了 ${habits.length} 个习惯项`);

    // 4. 创建勋章
    console.log('\n📌 Step 4: 创建勋章...');
    const badges: any[] = [];
    for (const badge of BADGES) {
        const b = await prisma.badges.upsert({
            where: { schoolId_name: { schoolId, name: badge.name } },
            update: {},
            create: {
                schoolId,
                name: badge.name,
                icon: badge.icon,
                category: badge.category,
                description: badge.description
            }
        });
        badges.push(b);
    }
    console.log(`   ✅ 创建了 ${badges.length} 个勋章`);

    // 5. 创建学生
    console.log('\n📌 Step 5: 创建学生...');
    const students: any[] = [];
    const classes = ['一年级1班', '二年级1班'];
    const teachers = [teacher1, teacher2];

    for (let i = 0; i < 10; i++) {
        const classIndex = Math.floor(i / 5);
        const className = classes[classIndex];
        const teacher = teachers[classIndex];

        // 检查学生是否存在
        const existingStudent = await prisma.students.findUnique({
            where: { schoolId_name: { schoolId, name: STUDENT_NAMES[i] } }
        });

        let student;
        if (existingStudent) {
            student = await prisma.students.update({
                where: { id: existingStudent.id },
                data: {
                    className,
                    teacherId: teacher.id,
                    level: randomInt(1, 10),
                    points: randomInt(100, 500),
                    exp: randomInt(500, 2000),
                    grade: classIndex === 0 ? '一年级' : '二年级',
                    semester: '上'
                }
            });
        } else {
            student = await prisma.students.create({
                data: {
                    schoolId,
                    name: STUDENT_NAMES[i],
                    className,
                    teacherId: teacher.id,
                    level: randomInt(1, 10),
                    points: randomInt(100, 500),
                    exp: randomInt(500, 2000),
                    grade: classIndex === 0 ? '一年级' : '二年级',
                    semester: '上',
                    avatarUrl: '/avatar.jpg'
                }
            });
        }
        students.push(student);
    }
    console.log(`   ✅ 创建/更新了 ${students.length} 个学生`);

    // 6. 为每个学生生成数据
    console.log('\n📌 Step 6: 为学生生成互动数据...');

    for (const student of students) {
        // 6a. 习惯打卡 (每个学生 10-20 条)
        const habitLogCount = randomInt(10, 20);
        for (let i = 0; i < habitLogCount; i++) {
            const habit = randomPick(habits);
            await prisma.habit_logs.create({
                data: {
                    schoolId,
                    studentId: student.id,
                    habitId: habit.id,
                    checkedAt: randomDate(30),
                    streakDays: randomInt(1, 7),
                    notes: randomPick(['做得很棒！', '继续保持！', '今天特别认真', ''])
                }
            });
        }

        // 6b. 勋章 (每学生 1-3 个)
        const badgeCount = randomInt(1, 3);
        const shuffledBadges = [...badges].sort(() => Math.random() - 0.5).slice(0, badgeCount);
        for (const badge of shuffledBadges) {
            await prisma.student_badges.create({
                data: {
                    studentId: student.id,
                    badgeId: badge.id,
                    awardedAt: randomDate(60),
                    reason: '表现优秀'
                }
            });
        }

        // 6c. 阅读记录 (每学生 1-2 本书，每本 3-5 条记录)
        const bookCount = randomInt(1, 2);
        const shuffledBooks = [...BOOKS].sort(() => Math.random() - 0.5).slice(0, bookCount);
        for (const bookInfo of shuffledBooks) {
            const book = await prisma.reading_books.create({
                data: {
                    schoolId,
                    studentId: student.id,
                    bookName: bookInfo.name,
                    totalPages: bookInfo.totalPages
                }
            });

            let currentPage = 0;
            const logCount = randomInt(3, 5);
            for (let j = 0; j < logCount; j++) {
                currentPage += randomInt(10, 30);
                currentPage = Math.min(currentPage, bookInfo.totalPages);
                await prisma.reading_logs.create({
                    data: {
                        bookId: book.id,
                        studentId: student.id,
                        schoolId,
                        currentPage,
                        duration: randomInt(15, 45),
                        recordedAt: randomDate(14)
                    }
                });
            }
        }

        // 6d. 学习过关记录 (每学生 5-10 条)
        const taskCount = randomInt(5, 10);
        for (let i = 0; i < taskCount; i++) {
            await prisma.task_records.create({
                data: {
                    schoolId,
                    studentId: student.id,
                    type: randomPick(['QC', 'TASK', 'SPECIAL'] as any),
                    title: randomPick(['语文朗读', '数学计算', '英语单词', '口算练习', '课文背诵']),
                    status: 'COMPLETED',
                    expAwarded: randomInt(10, 50),
                    createdAt: randomDate(14),
                    task_category: randomPick(['PROGRESS', 'TASK', 'SPECIAL'] as any)
                }
            });
        }
    }
    console.log(`   ✅ 为所有学生生成了习惯打卡、勋章、阅读、过关记录`);

    // 7. 生成 PK 对战记录
    console.log('\n📌 Step 7: 生成 PK 对战记录...');
    const pkCount = 10;
    for (let i = 0; i < pkCount; i++) {
        const playerA = students[randomInt(0, 4)]; // 班级1的学生
        const playerB = students[randomInt(5, 9)]; // 班级2的学生
        const winner = randomPick([playerA, playerB]);
        const scoreA = randomInt(60, 100);
        const scoreB = randomInt(60, 100);

        await prisma.pk_matches.create({
            data: {
                schoolId,
                studentA: playerA.id,
                studentB: playerB.id,
                topic: randomPick(['口算对决', '单词拼写', '古诗背诵', '数学思维']),
                winnerId: winner.id,
                status: 'COMPLETED',
                metadata: {
                    scoreA,
                    scoreB,
                    expReward: randomInt(20, 50),
                    pointsReward: randomInt(5, 15)
                },
                createdAt: randomDate(30)
            }
        });
    }
    console.log(`   ✅ 生成了 ${pkCount} 场 PK 对战`);

    // 8. 生成挑战赛记录
    console.log('\n📌 Step 8: 生成挑战赛记录...');
    const challenges = [
        { title: '数学计算王', description: '谁能成为最快的计算高手？' },
        { title: '阅读马拉松', description: '坚持阅读一周的挑战' },
        { title: '习惯养成7天', description: '连续7天完成所有习惯打卡' }
    ];

    for (const challengeData of challenges) {
        const challenge = await prisma.challenges.create({
            data: {
                schoolId,
                title: challengeData.title,
                description: challengeData.description,
                type: 'PERSONAL',
                status: 'ACTIVE',
                creatorId: admin.id,
                rewardPoints: randomInt(50, 100),
                rewardExp: randomInt(100, 200),
                startDate: randomDate(14),
                isActive: true
            }
        });

        // 添加参与者
        const participantCount = randomInt(3, 6);
        const shuffledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, participantCount);
        for (const student of shuffledStudents) {
            await prisma.challenge_participants.create({
                data: {
                    challengeId: challenge.id,
                    studentId: student.id,
                    status: 'JOINED',
                    result: randomPick(['WINNER', 'COMPLETED', 'FAILED', null] as any),
                    score: randomInt(50, 100)
                }
            });
        }
    }
    console.log(`   ✅ 生成了 ${challenges.length} 个挑战赛`);

    // 9. 创建家长账号并绑定
    console.log('\n📌 Step 9: 创建家长账号并绑定学生...');
    const firstStudent = students[0];

    // 先检查家长是否存在
    let parent = await prisma.parents.findFirst({
        where: { schoolId, phone: '13800000000' }
    });

    if (!parent) {
        parent = await prisma.parents.create({
            data: {
                phone: '13800000000',
                password: hashedPassword,
                name: `${firstStudent.name}家长`,
                schoolId,
                isActive: true
            }
        });
    }

    // 检查绑定是否存在
    const existingBinding = await prisma.parent_student_bindings.findFirst({
        where: { parentId: parent.id, studentId: firstStudent.id }
    });

    if (!existingBinding) {
        await prisma.parent_student_bindings.create({
            data: {
                parentId: parent.id,
                studentId: firstStudent.id,
                inviteCode: 'DEMO123456',
                isActive: true
            }
        });
    }
    console.log(`   ✅ 创建家长: ${parent.name} (手机: 13800000000, 密码: 123456)`);
    console.log(`   ✅ 已绑定学生: ${firstStudent.name}`);

    // 汇总
    console.log('\n' + '='.repeat(60));
    console.log('✅ 演示数据生成完成！');
    console.log('='.repeat(60));
    console.log('\n📋 账号信息:');
    console.log('   - 管理员: demo1 / 123456');
    console.log('   - 教师1: demo2 / 123456');
    console.log('   - 教师2: demo3 / 123456');
    console.log('   - 家长: 13800000000 / 123456');
    console.log(`\n📊 数据统计:`);
    console.log(`   - 学校: ${school.name}`);
    console.log(`   - 学生: ${students.length} 人`);
    console.log(`   - 班级: ${classes.join(', ')}`);
    console.log(`   - 习惯: ${habits.length} 项`);
    console.log(`   - 勋章: ${badges.length} 个`);
    console.log(`   - PK对战: ${pkCount} 场`);
    console.log(`   - 挑战赛: ${challenges.length} 个`);
}

main()
    .catch((e) => {
        console.error('❌ 出错了:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
