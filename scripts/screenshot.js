const { chromium } = require('playwright')

module.exports = {
  name: '截图示例',
  description: '打开网页并截图保存',
  async run(onLog) {
    onLog('启动浏览器...')
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    onLog('打开页面...')
    await page.goto('https://example.com')

    onLog('截图中...')
    await page.screenshot({ path: 'screenshot.png', fullPage: true })

    onLog('截图已保存为 screenshot.png')
    await browser.close()
    onLog('完成')
  }
}
