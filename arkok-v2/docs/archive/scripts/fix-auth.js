const fs = require('fs');
const path = require('path');

// 读取auth.service.js文件
const authServicePath = path.join(__dirname, 'server/dist/services/auth.service.js');
let content = fs.readFileSync(authServicePath, 'utf8');

// 找到硬编码的admin验证逻辑并替换
const oldLogic = `            // 硬编码的用户验证（临时实现）
            if (username === 'admin' && password === '123456') {`;

const newLogic = `            // 首先尝试数据库用户验证（支持所有老师账号）
            const dbUser = await this.prisma.teacher.findFirst({
                where: { username },
                include: {
                    school: true
                }
            });

            if (dbUser) {
                // 验证密码 - 使用bcrypt
                const bcrypt = require('bcryptjs');
                let passwordValid = false;

                // 特殊处理admin账号（兼容历史数据）
                if (username === 'admin' && password === '123456') {
                    passwordValid = dbUser.password === '123456' || await bcrypt.compare(password, dbUser.password);
                } else {
                    // 其他账号使用bcrypt验证
                    passwordValid = await bcrypt.compare(password, dbUser.password);
                }

                if (passwordValid) {
                    // 生成 JWT 令牌
                    const token = jwt.default.sign({
                        userId: dbUser.id,
                        username: dbUser.username,
                        name: dbUser.name,
                        displayName: dbUser.displayName,
                        email: dbUser.email,
                        role: dbUser.role,
                        schoolId: dbUser.schoolId,
                        schoolName: dbUser.school?.name,
                        primaryClassName: dbUser.primaryClassName
                    }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

                    const expiresIn = this.parseExpiresIn(JWT_EXPIRES_IN);

                    return {
                        success: true,
                        user: {
                            userId: dbUser.id,
                            username: dbUser.username,
                            name: dbUser.name,
                            displayName: dbUser.displayName || undefined,
                            email: dbUser.email || undefined,
                            role: dbUser.role,
                            schoolId: dbUser.schoolId,
                            schoolName: dbUser.school?.name || undefined,
                            primaryClassName: dbUser.primaryClassName || undefined
                        },
                        token,
                        expiresIn
                    };
                }
            }

            // 兼容性：如果没有找到数据库用户，尝试admin硬编码逻辑
            if (username === 'admin' && password === '123456') {`;

// 替换逻辑
if (content.includes(oldLogic)) {
    content = content.replace(oldLogic, newLogic);

    // 写回文件
    fs.writeFileSync(authServicePath, content);
    console.log('✅ auth.service.js 修复成功！现在支持所有老师账号登录');
} else {
    console.log('❌ 未找到目标代码段');
}