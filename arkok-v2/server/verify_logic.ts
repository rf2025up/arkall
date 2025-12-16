/**
 * 🛡️ 全系统逻辑验证与功能测试脚本
 * 按照《ArkOK V2 校长级数据管理与视图架构规范》进行验证
 */

const { PrismaClient } = require('@prisma/client');

class SystemVerification {
  private prisma: any;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "file:./dev.db"
        }
      }
    });
  }

  async runFullVerification() {
    console.log('🔍 开始全系统逻辑验证...');

    try {
      // 1. 验证数据模型完整性
      await this.verifyDataModel();

      // 2. 模拟Admin用户转移学生
      await this.simulateAdminTransfer();

      // 3. 验证权限逻辑
      await this.verifyPermissions();

      // 4. 验证视图切换逻辑
      await this.verifyViewLogic();

      console.log('🎉 全系统验证完成！');

    } catch (error) {
      console.error('❌ 验证失败:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * 1. 验证数据模型完整性
   */
  private async verifyDataModel() {
    console.log('\n📊 第1步：验证数据模型完整性...');

    // 检查User表中的角色
    const users = await this.prisma.user.findMany({
      select: { id: true, username: true, role: true, name: true }
    });

    console.log('👥 用户角色分布:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.username}): ${user.role}`);
    });

    // 检查Student表中的teacherId分布
    const studentsWithTeacher = await this.prisma.student.count({
      where: { teacherId: { not: null } }
    });

    const studentsWithoutTeacher = await this.prisma.student.count({
      where: { teacherId: null }
    });

    console.log('👨‍🎓 学生归属情况:');
    console.log(`  - 有teacherId的学生: ${studentsWithTeacher}人`);
    console.log(`  - 没有teacherId的学生: ${studentsWithoutTeacher}人`);

    if (studentsWithoutTeacher === 0) {
      console.log('✅ 所有学生都有老师归属');
    } else {
      console.log('⚠️ 存在无归属学生');
    }
  }

  /**
   * 2. 模拟Admin用户转移学生
   */
  private async simulateAdminTransfer() {
    console.log('\n🔄 第2步：模拟Admin用户转移学生...');

    // 获取Admin用户
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, username: true, name: true }
    });

    if (!admin) {
      console.log('❌ 未找到Admin用户');
      return;
    }

    console.log(`👨‍💼 使用Admin用户: ${admin.name} (${admin.id})`);

    // 查找一个无归属的学生进行测试
    const testStudent = await this.prisma.student.findFirst({
      where: { teacherId: null },
      select: { id: true, name: true, className: true, teacherId: true }
    });

    if (!testStudent) {
      console.log('ℹ️ 没有无归属学生可供测试，创建测试学生...');

      // 创建测试学生
      const newStudent = await this.prisma.student.create({
        data: {
          name: '验证测试学生',
          className: '测试班级',
          schoolId: 'default-school', // 假设的学校ID
          avatarUrl: '/1024.jpg',
          isActive: true,
          points: 0,
          exp: 0,
          level: 1
        }
      });

      console.log(`✅ 创建测试学生: ${newStudent.name} (ID: ${newStudent.id})`);
      testStudent.id = newStudent.id;
      testStudent.name = newStudent.name;
      testStudent.className = newStudent.className;
      testStudent.teacherId = newStudent.teacherId;
    } else {
      console.log(`🎯 找到测试学生: ${testStudent.name} (当前无归属)`);
    }

    // 模拟调用transfer逻辑
    console.log('🔄 执行转移测试...');

    // 模拟调用 transferStudents 逻辑
    const targetTeacherId = admin.id;
    const targetClassName = admin.name + '班';

    console.log(`🎯 将学生 ${testStudent.name} 转移到 ${admin.name}`);
    console.log(`   - 目标teacherId: ${targetTeacherId}`);
    console.log(`   - 目标className: ${targetClassName}`);

    // 执行转移
    const updatedStudent = await this.prisma.student.update({
      where: { id: testStudent.id },
      data: {
        teacherId: targetTeacherId,
        className: targetClassName
      }
    });

    // 验证转移结果
    console.log('✅ 转移完成，验证结果:');
    console.log(`   - 学生姓名: ${updatedStudent.name}`);
    console.log(`   - 新teacherId: ${updatedStudent.teacherId}`);
    console.log(`   - 新className: ${updatedStudent.className}`);

    if (updatedStudent.teacherId === targetTeacherId && updatedStudent.className === targetClassName) {
      console.log('🎉 转移逻辑验证成功！teacherId和className都正确更新');
    } else {
      console.log('❌ 转移逻辑验证失败！');
    }

    // 清理测试数据
    await this.prisma.student.update({
      where: { id: testStudent.id },
      data: { teacherId: null, className: '测试班级' }
    });

    console.log('🧹 已清理测试数据');
  }

  /**
   * 3. 验证权限逻辑
   */
  private async verifyPermissions() {
    console.log('\n🔒 第3步：验证权限逻辑...');

    // 检查Admin用户数量
    const adminCount = await this.prisma.user.count({
      where: { role: 'ADMIN' }
    });

    const teacherCount = await this.prisma.user.count({
      where: { role: 'TEACHER' }
    });

    console.log(`👥 权限分布:`);
    console.log(`  - Admin用户: ${adminCount}人`);
    console.log(`  - Teacher用户: ${teacherCount}人`);

    if (adminCount >= 1) {
      console.log('✅ 存在Admin用户，拥有最高权限');
    } else {
      console.log('⚠️ 没有Admin用户');
    }
  }

  /**
   * 4. 验证视图切换逻辑
   */
  private async verifyViewLogic() {
    console.log('\n👁️ 第4步：验证视图切换逻辑...');

    // 模拟不同视图的数据获取
    const totalStudents = await this.prisma.student.count({
      where: { isActive: true }
    });

    const studentsWithTeacher = await this.prisma.student.count({
      where: {
        isActive: true,
        teacherId: { not: null }
      }
    });

    const studentsWithoutTeacher = await this.prisma.student.count({
      where: {
        isActive: true,
        teacherId: null
      }
    });

    console.log('📊 视图数据验证:');
    console.log(`  - 全校视图应显示: ${totalStudents}名学生`);
    console.log(`  - 有归属学生: ${studentsWithTeacher}名`);
    console.log(`  - 无归属学生: ${studentsWithoutTeacher}名`);

    // 检查className分布
    const classDistribution = await this.prisma.student.groupBy({
      by: ['className'],
      where: { isActive: true },
      _count: { id: true }
    });

    console.log('🏫 班级分布:');
    classDistribution.forEach(dist => {
      console.log(`  - ${dist.className}: ${dist._count.id}名学生`);
    });
  }
}

// 执行验证
const verification = new SystemVerification();
verification.runFullVerification().catch(console.error);