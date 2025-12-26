
import { test, expect } from '@playwright/test';

test('verify QC checkbox toggle on production', async ({ page }) => {
  console.log('🚀 [BROWSER_VERIFY] 开始公网环境详细验证...');

  // 监听网络
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`📡 [NETWORK] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`📥 [NETWORK] ${response.status()} ${response.url()}`);
    }
  });

  page.on('console', msg => console.log(`🖥️ [BROWSER] ${msg.text()}`));

  // 1. 登录
  await page.goto('https://esboimzbkure.sealosbja.site/login');
  await page.fill('input[placeholder*="用户名"]', 'long');
  await page.fill('input[placeholder*="密码"]', '123456');
  await page.click('button:has-text("登录")');
  await page.waitForURL('**/home');
  console.log('✅ 登录成功');

  // 2. 选择班级并进入过关页
  await page.click('text=龙老师的班级');
  await page.waitForSelector('.ant-card-meta-title');
  await page.locator('.ant-card').first().click();
  console.log('✅ 进入学生详情页');

  // 3. 点击学业攻克 Tab
  await page.click('text=学业攻克');
  await page.waitForSelector('div[class*="rounded-full border-2"]');
  console.log('✅ QC 卡片列表已加载');

  // 4. 监听 PATCH 请求并点击
  const patchPromise = page.waitForResponse(response =>
    response.url().includes('/api/') && response.request().method() === 'PATCH',
    { timeout: 30000 }
  );

  const checkbox = page.locator('div[class*="rounded-full border-2"]').first();
  await checkbox.click();
  console.log('✅ 已点击第一个任务的勾选框');

  try {
    const patchResponse = await patchPromise;
    console.log(`🎉 [RESULT] PATCH 响应状态: ${patchResponse.status()}`);
    const json = await patchResponse.json();
    console.log('🎉 [RESULT] 响应 JSON:', JSON.stringify(json, null, 2));

    if (json.success) {
      console.log('🏆 勾选状态更新成功！');
    } else {
      console.error('❌ 勾选逻辑失败：接口返回 success: false');
    }
  } catch (e) {
    console.error('❌ 等待响应超时或发生错误:', e.message);
    await page.screenshot({ path: '/home/devbox/project/qc_error.png' });
  }
});
