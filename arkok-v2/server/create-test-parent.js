const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 查找宁可歆
    const student = await prisma.students.findFirst({
        where: { name: '宁可歆' }
    });

    if (!student) {
        console.log('未找到学生宁可歆');
        return;
    }

    console.log('找到学生:', student.name, student.id);

    // 创建测试家长账户
    const parent = await prisma.parents.upsert({
        where: { schoolId_phone: { schoolId: student.schoolId, phone: '18692226006' } },
        update: {},
        create: {
            schoolId: student.schoolId,
            phone: '18692226006',
            password: '0000',
            name: '测试爸爸',
            identity: '爸爸'
        }
    });

    console.log('家长账户:', parent.id, parent.phone);

    // 创建绑定关系
    const binding = await prisma.parent_student_bindings.upsert({
        where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
        update: { isActive: true },
        create: {
            parentId: parent.id,
            studentId: student.id,
            inviteCode: '8888'
        }
    });

    console.log('绑定成功! bindingId:', binding.id);
    console.log('');
    console.log('=== 测试账号信息 ===');
    console.log('手机号: 18692226006');
    console.log('密码: 0000');
    console.log('绑定学生: 宁可歆');
}

main().catch(console.error).finally(() => prisma.$disconnect());
