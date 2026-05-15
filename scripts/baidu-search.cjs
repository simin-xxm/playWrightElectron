const { chromium } = require('playwright');
const path = require('path');

// 获取打包后的 chromium 路径
function getChromiumPath() {
  // 打包后 chromium 在 resources/chromium 目录下
  if (process.env.CHROMIUM_PATH) {
    return process.env.CHROMIUM_PATH;
  }
  return undefined; // 开发模式使用默认路径
}

module.exports = {
  name: '测试kics登录',
  description: '测试kics登录',
  async run(onLog) {
    onLog('启动浏览器...');
    const executablePath = getChromiumPath();
    const browser = await chromium.launch({ headless: false, executablePath });
    const page = await browser.newPage();
    await page.goto('https://baidu.com');

    await page.fill('#form_item_userName', '123');
    await page.fill('#form_item_password', '321');
    await page.click('button:has-text("登 录")');


    onLog('脚本执行完毕，等待手动关闭浏览器...');
    await page.waitForEvent('close', { timeout: 0 }).catch(() => {});
    await browser.close().catch(() => {});
  },
};
