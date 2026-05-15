import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1600, 
    height: 1000,
    minWidth: 800, 
    minHeight: 600, 
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // 在 Windows 上隐藏菜单栏
  if (process.platform === 'win32') {
    win.setMenuBarVisibility(false)
    win.setAutoHideMenuBar(true)
  }

  // 测试向渲染进程推送消息
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// 退出时关闭所有窗口，macOS除外
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，重新创建窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // 在 Windows 上完全移除菜单
  if (process.platform === 'win32') {
    Menu.setApplicationMenu(null)
  }
  createWindow()
})

// --- Playwright 脚本管理 ---
function getScriptsDir() {
  // 开发模式下用项目根目录的 scripts，打包后用 resources/scripts
  if (VITE_DEV_SERVER_URL) {
    return path.join(process.env.APP_ROOT, 'scripts')
  }
  return path.join(process.resourcesPath, 'scripts')
}

ipcMain.handle('get-scripts', async () => {
  const scriptsDir = getScriptsDir()
  if (!fs.existsSync(scriptsDir)) return []
  const files = fs.readdirSync(scriptsDir).filter(f => (f.endsWith('.js') || f.endsWith('.cjs')) && !f.startsWith('script-runner'))
  const scripts = []
  for (const file of files) {
    const content = fs.readFileSync(path.join(scriptsDir, file), 'utf-8')
    const nameMatch = content.match(/name:\s*['"](.+?)['"]/)
    const descMatch = content.match(/description:\s*['"](.+?)['"]/)
    scripts.push({
      file,
      name: nameMatch ? nameMatch[1] : file,
      description: descMatch ? descMatch[1] : '',
    })
  }
  return scripts
})

ipcMain.handle('run-script', async (_, scriptFile: string) => {
  const scriptsDir = getScriptsDir()
  const scriptPath = path.join(scriptsDir, scriptFile)

  // 安全检查：不允许路径穿越
  if (!scriptPath.startsWith(scriptsDir)) {
    throw new Error('Invalid script path')
  }
  if (!fs.existsSync(scriptPath)) {
    throw new Error('Script not found')
  }

  const { fork } = await import('node:child_process')
  const runnerPath = path.join(scriptsDir, 'script-runner.cjs')

  // 生产模式下传递打包的 Chromium 路径
  let chromiumPath: string | undefined
  if (!VITE_DEV_SERVER_URL) {
    const chromiumDir = path.join(process.resourcesPath, 'chromium')
    if (process.platform === 'win32') {
      chromiumPath = path.join(chromiumDir, 'chrome.exe')
    } else if (process.platform === 'darwin') {
      chromiumPath = path.join(chromiumDir, 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
    } else {
      chromiumPath = path.join(chromiumDir, 'chrome')
    }
  }

  return new Promise((resolve) => {
    const child = fork(runnerPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      cwd: scriptsDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        NODE_PATH: VITE_DEV_SERVER_URL
          ? path.join(process.env.APP_ROOT!, 'node_modules')
          : path.join(process.resourcesPath, 'app', 'node_modules'),
        ...(chromiumPath ? { CHROMIUM_PATH: chromiumPath } : {}),
      },
    })

    child.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().trim().split('\n')
      lines.forEach((line: string) => win?.webContents.send('script-log', line))
    })

    child.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().trim().split('\n')
      lines.forEach((line: string) => win?.webContents.send('script-log', `⚠️ ${line}`))
    })

    child.on('message', (msg: any) => {
      if (msg.type === 'log') {
        win?.webContents.send('script-log', msg.data)
      }
    })

    child.on('exit', (code) => {
      if (code === 0) resolve({ success: true })
      else resolve({ success: false, error: `Exit code: ${code}` })
    })

    child.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })
  })
})