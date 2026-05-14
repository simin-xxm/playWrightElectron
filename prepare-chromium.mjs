// 准备打包用的 Chromium 浏览器
// 运行: node prepare-chromium.mjs
// 会将 Playwright 安装的 Chromium 复制到项目的 chromium/ 目录

import { execSync } from 'child_process'
import { cpSync, mkdirSync, existsSync, rmSync } from 'fs'
import { join } from 'path'
import { homedir, platform } from 'os'

const targetDir = join(process.cwd(), 'chromium')

// 清理旧目录
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true })
}
mkdirSync(targetDir, { recursive: true })

// 获取 Playwright 浏览器安装路径
let browsersPath
if (platform() === 'win32') {
  browsersPath = join(homedir(), 'AppData', 'Local', 'ms-playwright')
} else if (platform() === 'darwin') {
  browsersPath = join(homedir(), 'Library', 'Caches', 'ms-playwright')
} else {
  browsersPath = join(homedir(), '.cache', 'ms-playwright')
}

// 查找 chromium 目录
import { readdirSync } from 'fs'
const dirs = readdirSync(browsersPath).filter(d => d.startsWith('chromium-'))
if (dirs.length === 0) {
  console.error('未找到 Playwright Chromium，请先运行: npx playwright install chromium')
  process.exit(1)
}

const chromiumDir = join(browsersPath, dirs[dirs.length - 1])
console.log(`复制 Chromium: ${chromiumDir} -> ${targetDir}`)

if (platform() === 'win32') {
  // Windows: chrome-win64/ 目录
  const winDir = existsSync(join(chromiumDir, 'chrome-win64')) ? 'chrome-win64' : 'chrome-win'
  cpSync(join(chromiumDir, winDir), targetDir, { recursive: true })
} else if (platform() === 'darwin') {
  // macOS: chrome-mac 或 chrome-mac-arm64
  const macDir = existsSync(join(chromiumDir, 'chrome-mac-arm64')) ? 'chrome-mac-arm64' : 'chrome-mac'
  cpSync(join(chromiumDir, macDir), targetDir, { recursive: true })
} else {
  // Linux: chrome-linux/ 目录
  cpSync(join(chromiumDir, 'chrome-linux'), targetDir, { recursive: true })
}

console.log('✓ Chromium 已复制到 chromium/ 目录')
