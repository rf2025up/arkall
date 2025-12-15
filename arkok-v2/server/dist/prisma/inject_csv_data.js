"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- 🚀 Starting Final Data Injection Mission from CSV 🚀 ---');
    // 1. 找到 admin 用户所在的学校
    const adminUser = await prisma.teacher.findFirst({ where: { username: 'admin' } });
    if (!adminUser || !adminUser.schoolId) {
        throw new Error('❌ Critical Error: Cannot find admin user or their school!');
    }
    const targetSchoolId = adminUser.schoolId;
    console.log(`🎯 Data will be injected into School ID: ${targetSchoolId}`);
    // 2. 读取 CSV 文件
    const csvFilePath = path.join(__dirname, '../../migration_data/students.csv');
    const studentsFromCsv = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (data) => studentsFromCsv.push(data))
            .on('end', () => {
            console.log(`✅ Successfully read ${studentsFromCsv.length} records from CSV file.`);
            resolve();
        })
            .on('error', reject);
    });
    let injectedCount = 0;
    let skippedCount = 0;
    // 3. 遍历并注入每一个学生
    for (const oldStudent of studentsFromCsv) {
        const studentName = oldStudent.name;
        if (!studentName)
            continue;
        const existingStudent = await prisma.student.findFirst({
            where: { name: studentName, schoolId: targetSchoolId },
        });
        if (existingStudent) {
            console.log(`🟡 Skipping "${studentName}", already exists.`);
            skippedCount++;
            continue;
        }
        const points = parseInt(oldStudent.score, 10) || 0;
        const exp = parseInt(oldStudent.total_exp, 10) || 0;
        await prisma.student.create({
            data: {
                name: studentName,
                className: oldStudent.class_name || '未分配班级',
                points: points,
                exp: exp,
                level: Math.floor(exp / 100) + 1,
                schoolId: targetSchoolId,
                avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(studentName)}`,
            },
        });
        console.log(`✅ Injected "${studentName}" successfully!`);
        injectedCount++;
    }
    console.log(`\n--- ✨ Injection Mission Complete ✨ ---`);
    console.log(`- Total students injected: ${injectedCount}`);
    console.log(`- Students skipped (duplicates): ${skippedCount}`);
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=inject_csv_data.js.map