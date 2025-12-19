const fs = require('fs');

// 读取文件
const filePath = './dist/routes/lms.routes.js';
let content = fs.readFileSync(filePath, 'utf8');

// 找到两个路由的位置
const singleRecordRouteStart = content.indexOf('// 更新任务状态\nrouter.patch(\'/records/:recordId/status\'');
const batchRouteStart = content.indexOf('// 批量更新任务状态\nrouter.patch(\'/records/batch/status\'');

if (singleRecordRouteStart === -1 || batchRouteStart === -1) {
  console.error('无法找到路由定义');
  process.exit(1);
}

// 提取批量路由
const batchRouteEnd = content.indexOf('});', batchRouteStart) + 3;
const batchRoute = content.substring(batchRouteStart, batchRouteEnd);

// 提取单个记录路由
const singleRecordRouteEnd = content.indexOf('});', singleRecordRouteStart) + 3;
const singleRecordRoute = content.substring(singleRecordRouteStart, singleRecordRouteEnd);

// 创建新内容：先放批量路由，再放单个记录路由
const newContent =
  content.substring(0, singleRecordRouteStart) +
  batchRoute + '\n\n' +
  singleRecordRoute +
  content.substring(singleRecordRouteEnd);

// 写回文件
fs.writeFileSync(filePath, newContent);

console.log('✅ 路由顺序已修复：批量路由现在在单个记录路由之前');