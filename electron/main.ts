import { app, BrowserWindow, ipcMain } from 'electron'
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
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

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
  const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js') && f !== 'script-runner.js')
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
  const runnerPath = path.join(scriptsDir, 'script-runner.js')

  // 生产模式下传递打包的 Chromium 路径
  let chromiumPath: string | undefined
  if (!VITE_DEV_SERVER_URL) {
    const chromiumDir = path.join(process.resourcesPath, 'chromium')
    if (process.platform === 'win32') {
      chromiumPath = path.join(chromiumDir, 'chrome.exe')
    } else if (process.platform === 'darwin') {
      chromiumPath = path.join(chromiumDir, 'Chromium.app', 'Contents', 'MacOS', 'Chromium')
      // fallback: 某些版本目录结构不同
      if (!fs.existsSync(chromiumPath)) {
        chromiumPath = path.join(chromiumDir, 'chrome')
      }
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
