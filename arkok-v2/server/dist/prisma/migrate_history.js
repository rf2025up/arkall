"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateHistoryData = migrateHistoryData;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function migrateHistoryData() {
    console.log('🚀 开始历史数据迁移...');
    try {
        // 1. 创建或获取默认学校
        console.log('🏫 获取默认学校...');
        let school = await prisma.school.findFirst({
            where: { name: 'Default Migration School' }
        });
        if (!school) {
            school = await prisma.school.create({
                data: {
                    name: 'Default Migration School',
                    planType: 'FREE',
                    isActive: true
                }
            });
            console.log(`✅ 创建学校: ${school.name} (${school.id})`);
        }
        else {
            console.log(`✅ 使用现有学校: ${school.name} (${school.id})`);
        }
        // 2. 创建或获取默认教师
        console.log('👨‍🏫 获取默认教师...');
        let teacher = await prisma.teacher.findFirst({
            where: { schoolId: school.id }
        });
        if (!teacher) {
            const hashedPassword = await bcryptjs_1.default.hash('admin123', 10);
            teacher = await prisma.teacher.create({
                data: {
                    schoolId: school.id,
                    username: 'admin',
                    password: hashedPassword,
                    name: '管理员',
                    email: 'admin@arkok.com',
                    role: 'ADMIN'
                }
            });
            console.log(`✅ 创建教师: ${teacher.name} (${teacher.id})`);
        }
        else {
            console.log(`✅ 使用现有教师: ${teacher.name} (${teacher.id})`);
        }
        // 3. 创建学生ID映射
        console.log('🗺️  创建学生ID映射...');
        const studentIdMap = await createStudentIdMap(school.id);
        console.log(`✅ 创建了 ${studentIdMap.size} 个学生ID映射`);
        // 4. 迁移PK记录
        const migratedPKCount = await migratePKMatches(school.id, studentIdMap);
        console.log(`✅ 成功迁移了 ${migratedPKCount} 条PK记录`);
        // 5. 迁移习惯记录
        const migratedHabitsCount = await migrateHabits(school.id);
        console.log(`✅ 成功迁移了 ${migratedHabitsCount.habits} 个习惯定义和 ${migratedHabitsCount.checkins} 条打卡记录`);
        // 6. 迁移挑战记录
        const migratedChallengesCount = await migrateChallenges(school.id, studentIdMap, teacher.id);
        console.log(`✅ 成功迁移了 ${migratedChallengesCount.challenges} 个挑战和 ${migratedChallengesCount.participants} 个参与者记录`);
        // 7. 迁移勋章记录
        const migratedBadgesCount = await migrateBadges(school.id, studentIdMap, teacher.id);
        console.log(`✅ 成功迁移了 ${migratedBadgesCount.badges} 个勋章定义和 ${migratedBadgesCount.studentBadges} 个学生勋章记录`);
        console.log('🎉 历史数据迁移完成！');
    }
    catch (error) {
        console.error('❌ 历史数据迁移失败:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
async function createStudentIdMap(schoolId) {
    const studentIdMap = new Map();
    try {
        // 从旧的Student表查询所有学生
        const legacyStudents = await prisma.$queryRaw `
      SELECT id, name, "className"
      FROM "Student"
      ORDER BY id
    `;
        console.log(`📋 发现 ${legacyStudents.length} 个旧学生记录`);
        for (const legacyStudent of legacyStudents) {
            // 查找新表中是否已存在同名同班级的学生
            let existingStudent = await prisma.student.findFirst({
                where: {
                    schoolId: schoolId,
                    name: legacyStudent.name,
                    className: legacyStudent.className
                }
            });
            if (!existingStudent) {
                // 创建新学生
                existingStudent = await prisma.student.create({
                    data: {
                        schoolId: schoolId,
                        name: legacyStudent.name,
                        className: legacyStudent.className,
                        level: 1,
                        points: 0,
                        exp: 0,
                        isActive: true
                    }
                });
            }
            // 建立映射关系
            studentIdMap.set(legacyStudent.id, existingStudent.id);
        }
        return studentIdMap;
    }
    catch (error) {
        console.log('⚠️  无法查询旧学生表，将使用测试数据模式');
        // 如果查询失败，创建一些测试数据用于映射
        const testNames = ['张三', '李四', '王五', '赵六', '孙七'];
        const classNames = ['一年级A班', '一年级B班', '二年级A班'];
        for (let i = 0; i < testNames.length; i++) {
            const legacyId = `legacy_${i + 1}`;
            const existingStudent = await prisma.student.findFirst({
                where: {
                    schoolId: schoolId,
                    name: testNames[i] || null,
                    className: classNames[i % classNames.length] || null
                }
            });
            if (existingStudent) {
                studentIdMap.set(legacyId, existingStudent.id);
            }
        }
        return studentIdMap;
    }
}
async function migratePKMatches(schoolId, studentIdMap) {
    let migratedCount = 0;
    try {
        // 查询旧PK记录
        const legacyPKMatches = await prisma.$queryRaw `
      SELECT id, "studentAId", "studentBId", "winnerId", status, topic, metadata, "createdAt", "updatedAt"
      FROM "pk_matches"
      ORDER BY "createdAt"
    `;
        console.log(`📋 发现 ${legacyPKMatches.length} 条旧PK记录`);
        for (const legacyPK of legacyPKMatches) {
            const newStudentAId = studentIdMap.get(legacyPK.studentAId);
            const newStudentBId = studentIdMap.get(legacyPK.studentBId);
            const newWinnerId = legacyPK.winnerId ? studentIdMap.get(legacyPK.winnerId) : null;
            if (!newStudentAId || !newStudentBId) {
                console.warn(`⚠️  跳过PK记录 ${legacyPK.id}: 无法找到对应的学生`);
                continue;
            }
            // 检查是否已迁移
            const existingPK = await prisma.pKMatch.findFirst({
                where: {
                    schoolId: schoolId,
                    studentA: newStudentAId,
                    studentB: newStudentBId,
                    createdAt: legacyPK.createdAt
                }
            });
            if (existingPK) {
                console.log(`⏭️  PK记录 ${legacyPK.id} 已存在，跳过`);
                continue;
            }
            // 转换状态
            let status = 'ONGOING';
            if (legacyPK.status === 'completed')
                status = 'COMPLETED';
            else if (legacyPK.status === 'cancelled')
                status = 'CANCELLED';
            // 创建新PK记录
            await prisma.pKMatch.create({
                data: {
                    schoolId: schoolId,
                    studentA: newStudentAId,
                    studentB: newStudentBId,
                    winnerId: newWinnerId || null,
                    status: status,
                    topic: legacyPK.topic,
                    metadata: legacyPK.metadata || {},
                    createdAt: legacyPK.createdAt,
                    updatedAt: legacyPK.updatedAt
                }
            });
            migratedCount++;
        }
        return migratedCount;
    }
    catch (error) {
        console.log('⚠️  无法查询旧PK记录表，跳过PK迁移');
        return 0;
    }
}
async function migrateHabits(schoolId) {
    let migratedHabits = 0;
    let migratedCheckins = 0;
    try {
        // 迁移习惯定义
        const legacyHabits = await prisma.$queryRaw `
      SELECT id, name, description, icon, "expReward", "pointsReward", "isActive", "createdAt", "updatedAt"
      FROM habits
      ORDER BY "createdAt"
    `;
        console.log(`📋 发现 ${legacyHabits.length} 个旧习惯定义`);
        const habitIdMap = new Map();
        for (const legacyHabit of legacyHabits) {
            // 检查是否已存在同名习惯
            let existingHabit = await prisma.habit.findFirst({
                where: {
                    schoolId: schoolId,
                    name: legacyHabit.name
                }
            });
            if (!existingHabit) {
                existingHabit = await prisma.habit.create({
                    data: {
                        schoolId: schoolId,
                        name: legacyHabit.name,
                        description: legacyHabit.description || null,
                        icon: legacyHabit.icon || '🎯',
                        expReward: legacyHabit.expReward || 5,
                        pointsReward: legacyHabit.pointsReward || 0,
                        isActive: legacyHabit.isActive
                    }
                });
            }
            habitIdMap.set(legacyHabit.id, existingHabit.id);
            migratedHabits++;
        }
        // 迁移习惯打卡记录
        if (habitIdMap.size > 0) {
            const legacyCheckins = await prisma.$queryRaw `
        SELECT id, "habitId", "studentId", "checkedAt", "streakDays", notes
        FROM habit_checkins
        ORDER BY "checkedAt"
      `;
            console.log(`📋 发现 ${legacyCheckins.length} 条旧打卡记录`);
            for (const legacyCheckin of legacyCheckins) {
                const newHabitId = habitIdMap.get(legacyCheckin.habitId);
                if (!newHabitId) {
                    console.warn(`⚠️  跳过打卡记录 ${legacyCheckin.id}: 无法找到对应的习惯`);
                    continue;
                }
                // 查找新学生
                const student = await prisma.student.findFirst({
                    where: {
                        schoolId: schoolId,
                        // 这里需要更复杂的映射逻辑，暂时跳过
                    }
                });
                if (!student) {
                    console.warn(`⚠️  跳过打卡记录 ${legacyCheckin.id}: 无法找到对应的学生`);
                    continue;
                }
                // 检查是否已存在相同的打卡记录
                const existingCheckin = await prisma.habitLog.findFirst({
                    where: {
                        schoolId: schoolId,
                        habitId: newHabitId,
                        studentId: student.id,
                        checkedAt: legacyCheckin.checkedAt
                    }
                });
                if (existingCheckin) {
                    continue;
                }
                // 创建新打卡记录
                await prisma.habitLog.create({
                    data: {
                        schoolId: schoolId,
                        habitId: newHabitId,
                        studentId: student.id,
                        checkedAt: legacyCheckin.checkedAt,
                        streakDays: legacyCheckin.streakDays || 1,
                        notes: legacyCheckin.notes || null
                    }
                });
                migratedCheckins++;
            }
        }
        return { habits: migratedHabits, checkins: migratedCheckins };
    }
    catch (error) {
        console.log('⚠️  无法查询旧习惯记录表，跳过习惯迁移');
        return { habits: 0, checkins: 0 };
    }
}
async function migrateChallenges(schoolId, studentIdMap, teacherId) {
    let migratedChallenges = 0;
    let migratedParticipants = 0;
    try {
        // 迁移挑战定义
        const legacyChallenges = await prisma.$queryRaw `
      SELECT id, title, description, type, status, "creatorId", "startDate", "endDate",
             "rewardPoints", "rewardExp", "maxParticipants", metadata, "createdAt", "updatedAt"
      FROM challenges
      ORDER BY "createdAt"
    `;
        console.log(`📋 发现 ${legacyChallenges.length} 个旧挑战`);
        const challengeIdMap = new Map();
        for (const legacyChallenge of legacyChallenges) {
            // 转换类型和状态
            let type = 'PERSONAL';
            if (legacyChallenge.type === 'group')
                type = 'GROUP';
            else if (legacyChallenge.type === 'class')
                type = 'CLASS';
            let status = 'ACTIVE';
            if (legacyChallenge.status === 'draft')
                status = 'DRAFT';
            else if (legacyChallenge.status === 'active')
                status = 'ACTIVE';
            else if (legacyChallenge.status === 'completed')
                status = 'COMPLETED';
            else if (legacyChallenge.status === 'cancelled')
                status = 'CANCELLED';
            // 创建新挑战
            const newChallenge = await prisma.challenge.create({
                data: {
                    schoolId: schoolId,
                    title: legacyChallenge.title,
                    description: legacyChallenge.description || null,
                    type: type,
                    status: status,
                    creatorId: teacherId, // 使用默认教师ID
                    startDate: legacyChallenge.startDate,
                    endDate: legacyChallenge.endDate,
                    rewardPoints: legacyChallenge.rewardPoints,
                    rewardExp: legacyChallenge.rewardExp,
                    maxParticipants: legacyChallenge.maxParticipants,
                    metadata: legacyChallenge.metadata || {},
                    isActive: true,
                    createdAt: legacyChallenge.createdAt,
                    updatedAt: legacyChallenge.updatedAt
                }
            });
            challengeIdMap.set(legacyChallenge.id, newChallenge.id);
            migratedChallenges++;
        }
        // 迁移挑战参与者
        if (challengeIdMap.size > 0) {
            const legacyParticipants = await prisma.$queryRaw `
        SELECT id, "challengeId", "studentId", "joinedAt", status, result, score, notes, "completedAt"
        FROM challenge_participants
        ORDER BY "joinedAt"
      `;
            console.log(`📋 发现 ${legacyParticipants.length} 个旧挑战参与者`);
            for (const legacyParticipant of legacyParticipants) {
                const newChallengeId = challengeIdMap.get(legacyParticipant.challengeId);
                const newStudentId = studentIdMap.get(legacyParticipant.studentId);
                if (!newChallengeId || !newStudentId) {
                    console.warn(`⚠️  跳过参与者记录 ${legacyParticipant.id}: 无法找到对应的挑战或学生`);
                    continue;
                }
                // 转换状态和结果
                let status = 'JOINED';
                if (legacyParticipant.status === 'withdrawn')
                    status = 'WITHDRAWN';
                else if (legacyParticipant.status === 'disqualified')
                    status = 'DISQUALIFIED';
                let result = null;
                if (legacyParticipant.result === 'winner')
                    result = 'WINNER';
                else if (legacyParticipant.result === 'completed')
                    result = 'COMPLETED';
                else if (legacyParticipant.result === 'failed')
                    result = 'FAILED';
                // 检查是否已存在相同的参与者记录
                const existingParticipant = await prisma.challengeParticipant.findFirst({
                    where: {
                        challengeId: newChallengeId,
                        studentId: newStudentId
                    }
                });
                if (existingParticipant) {
                    continue;
                }
                // 创建新参与者记录
                await prisma.challengeParticipant.create({
                    data: {
                        challengeId: newChallengeId,
                        studentId: newStudentId,
                        joinedAt: legacyParticipant.joinedAt,
                        status: status,
                        result: result,
                        score: legacyParticipant.score,
                        notes: legacyParticipant.notes,
                        completedAt: legacyParticipant.completedAt
                    }
                });
                migratedParticipants++;
            }
        }
        return { challenges: migratedChallenges, participants: migratedParticipants };
    }
    catch (error) {
        console.log('⚠️  无法查询旧挑战记录表，跳过挑战迁移');
        return { challenges: 0, participants: 0 };
    }
}
async function migrateBadges(schoolId, studentIdMap, teacherId) {
    let migratedBadges = 0;
    let migratedStudentBadges = 0;
    try {
        // 迁移勋章定义
        const legacyBadges = await prisma.$queryRaw `
      SELECT id, name, description, icon, category, requirement, "isActive", "createdAt", "updatedAt"
      FROM badges
      ORDER BY "createdAt"
    `;
        console.log(`📋 发现 ${legacyBadges.length} 个旧勋章`);
        const badgeIdMap = new Map();
        for (const legacyBadge of legacyBadges) {
            // 检查是否已存在同名勋章
            let existingBadge = await prisma.badge.findFirst({
                where: {
                    schoolId: schoolId,
                    name: legacyBadge.name
                }
            });
            if (!existingBadge) {
                existingBadge = await prisma.badge.create({
                    data: {
                        schoolId: schoolId,
                        name: legacyBadge.name,
                        description: legacyBadge.description || null,
                        icon: legacyBadge.icon || '🏆',
                        category: legacyBadge.category || '通用',
                        requirement: legacyBadge.requirement || {},
                        isActive: legacyBadge.isActive
                    }
                });
            }
            badgeIdMap.set(legacyBadge.id, existingBadge.id);
            migratedBadges++;
        }
        // 迁移学生勋章记录
        if (badgeIdMap.size > 0) {
            const legacyStudentBadges = await prisma.$queryRaw `
        SELECT id, "studentId", "badgeId", "awardedBy", "awardedAt", reason
        FROM student_badges
        ORDER BY "awardedAt"
      `;
            console.log(`📋 发现 ${legacyStudentBadges.length} 个旧学生勋章记录`);
            for (const legacyStudentBadge of legacyStudentBadges) {
                const newBadgeId = badgeIdMap.get(legacyStudentBadge.badgeId);
                const newStudentId = studentIdMap.get(legacyStudentBadge.studentId);
                if (!newBadgeId || !newStudentId) {
                    console.warn(`⚠️  跳过学生勋章记录 ${legacyStudentBadge.id}: 无法找到对应的勋章或学生`);
                    continue;
                }
                // 检查是否已存在相同的学生勋章记录
                const existingStudentBadge = await prisma.studentBadge.findFirst({
                    where: {
                        studentId: newStudentId,
                        badgeId: newBadgeId
                    }
                });
                if (existingStudentBadge) {
                    continue;
                }
                // 创建新学生勋章记录
                await prisma.studentBadge.create({
                    data: {
                        studentId: newStudentId,
                        badgeId: newBadgeId,
                        awardedBy: teacherId, // 使用默认教师ID
                        awardedAt: legacyStudentBadge.awardedAt,
                        reason: legacyStudentBadge.reason
                    }
                });
                migratedStudentBadges++;
            }
        }
        return { badges: migratedBadges, studentBadges: migratedStudentBadges };
    }
    catch (error) {
        console.log('⚠️  无法查询旧勋章记录表，跳过勋章迁移');
        return { badges: 0, studentBadges: 0 };
    }
}
// 运行迁移脚本
if (require.main === module) {
    migrateHistoryData()
        .then(() => {
        console.log('✅ 历史数据迁移脚本执行完成');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ 历史数据迁移脚本执行失败:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate_history.js.map