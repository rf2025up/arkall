const puppeteer = require('puppeteer');

async function testPrepPage() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // 监听网络请求
  page.on('request', request => {
    if (request.url().includes('/api/lms/task-library')) {
      console.log('🌐 API Request:', request.url());
      console.log('Headers:', request.headers());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/lms/task-library')) {
      console.log('📡 API Response:', response.status());
      response.json().then(data => {
        console.log('Data:', JSON.stringify(data, null, 2));
      }).catch(e => console.log('Response JSON parse error:', e.message));
    }
  });

  try {
    console.log('🚀 访问备课页...');
    await page.goto('http://localhost:3000/prep', { waitUntil: 'networkidle2' });

    console.log('📄 页面标题:', await page.title());

    // 等待用户登录
    console.log('⏳ 等待页面加载和用户交互...');

    // 截图
    await page.screenshot({ path: 'prep-page-screenshot.png' });

  } catch (error) {
    console.error('❌ 错误:', error);
  }

  // 保持浏览器打开一段时间
  setTimeout(async () => {
    await browser.close();
  }, 30000);
}

testPrepPage();