const fs = require('fs');
const path = require('path');

// 需要更新的文件列表
const filesToUpdate = [
  '/home/devbox/project/arkok-v2/client/src/components/BigScreen/Legacy/PKBoardCard.tsx',
  '/home/devbox/project/arkok-v2/client/src/pages/BadgePage.tsx',
  '/home/devbox/project/arkok-v2/client/src/pages/BigScreen.tsx'
];

// 替换函数
function replaceDicebearUrls(content) {
  return content
    .replace(/https:\/\/api\.dicebear\.com\/[^'"]*/g, '/avatar.jpg')
    .replace(/\/1024\.jpg/g, '/avatar.jpg')
    .replace(/\/avatar\.png/g, '/avatar.jpg');
}

filesToUpdate.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`🔄 更新文件: ${filePath}`);
      let content = fs.readFileSync(filePath, 'utf8');
      content = replaceDicebearUrls(content);
      fs.writeFileSync(filePath, content);
      console.log(`✅ 更新完成: ${filePath}`);
    } else {
      console.log(`⚠️ 文件不存在: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ 更新文件失败 ${filePath}:`, error);
  }
});

console.log('🎉 所有头像URL替换完成！');