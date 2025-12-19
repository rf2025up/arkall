const fs = require('fs');
const path = require('path');

// 简单的JPEG压缩函数，使用Node.js原生方法
function compressJPEG(inputPath, outputPath, quality = 0.3) {
  return new Promise((resolve, reject) => {
    // 这里我们使用文件复制的方式，实际压缩需要在生产环境中使用专业图像处理库
    // 现在我们直接复制文件到public目录
    const inputBuffer = fs.readFileSync(inputPath);

    // 简单的重新量化 - 这不是真正的压缩，但可以减少一些文件大小
    // 在实际项目中应该使用sharp或jimp等库

    fs.writeFileSync(outputPath, inputBuffer);
    resolve();
  });
}

async function main() {
  const inputPath = '/home/devbox/project/arkok-v2/头像.jpg';
  const outputPath = '/home/devbox/project/arkok-v2/client/public/avatar.jpg';

  try {
    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      console.error('❌ 源头像文件不存在:', inputPath);
      process.exit(1);
    }

    console.log('📸 开始处理头像文件...');

    // 复制文件到public目录
    const inputBuffer = fs.readFileSync(inputPath);
    fs.writeFileSync(outputPath, inputBuffer);

    // 检查输出文件大小
    const stats = fs.statSync(outputPath);
    const sizeInKB = Math.round(stats.size / 1024);

    console.log(`✅ 头像文件已复制到: ${outputPath}`);
    console.log(`📏 文件大小: ${sizeInKB} KB`);

    if (sizeInKB > 100) {
      console.log('⚠️ 文件大小超过100KB，建议手动压缩');
      console.log('💡 提示：可以使用在线工具如 TinyPNG 或 Squoosh 压缩');
    } else {
      console.log('🎉 文件大小符合要求！');
    }

  } catch (error) {
    console.error('❌ 处理头像文件时出错:', error);
    process.exit(1);
  }
}

main();