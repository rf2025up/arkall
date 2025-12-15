import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface OldStudent {
  id: string;
  name: string;
  score: string;
  total_exp: string;
  class_name: string;
}

async function main() {
  console.log('--- 🚀 Starting Final Data Injection Mission from CSV 🚀 ---');

  // 1. 找到 admin 用户所在的学校
  const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (!adminUser || !adminUser.schoolId) {
    throw new Error('❌ Critical Error: Cannot find admin user or their school!');
  }
  const targetSchoolId = adminUser.schoolId;
  console.log(`🎯 Data will be injected into School ID: ${targetSchoolId}`);

  // 2. 读取 CSV 文件
  const csvFilePath = path.join(__dirname, '../../arkok-v2/migration_data/students.csv');
  const studentsFromCsv: OldStudent[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
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
    if (!studentName) continue;

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