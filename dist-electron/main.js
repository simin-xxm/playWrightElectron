import { app, BrowserWindow, Menu, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 1e3,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  if (process.platform === "win32") {
    win.setMenuBarVisibility(false);
    win.setAutoHideMenuBar(true);
  }
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  if (process.platform === "win32") {
    Menu.setApplicationMenu(null);
  }
  createWindow();
});
function getScriptsDir() {
  if (VITE_DEV_SERVER_URL) {
    return path.join(process.env.APP_ROOT, "scripts");
  }
  return path.join(process.resourcesPath, "scripts");
}
ipcMain.handle("get-scripts", async () => {
  const scriptsDir = getScriptsDir();
  if (!fs.existsSync(scriptsDir)) return [];
  const files = fs.readdirSync(scriptsDir).filter((f) => (f.endsWith(".js") || f.endsWith(".cjs")) && !f.startsWith("script-runner"));
  const scripts = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(scriptsDir, file), "utf-8");
    const nameMatch = content.match(/name:\s*['"](.+?)['"]/);
    const descMatch = content.match(/description:\s*['"](.+?)['"]/);
    scripts.push({
      file,
      name: nameMatch ? nameMatch[1] : file,
      description: descMatch ? descMatch[1] : ""
    });
  }
  return scripts;
});
ipcMain.handle("run-script", async (_, scriptFile) => {
  const scriptsDir = getScriptsDir();
  const scriptPath = path.join(scriptsDir, scriptFile);
  if (!scriptPath.startsWith(scriptsDir)) {
    throw new Error("Invalid script path");
  }
  if (!fs.existsSync(scriptPath)) {
    throw new Error("Script not found");
  }
  const { fork } = await import("node:child_process");
  const runnerPath = path.join(scriptsDir, "script-runner.cjs");
  let chromiumPath;
  if (!VITE_DEV_SERVER_URL) {
    const chromiumDir = path.join(process.resourcesPath, "chromium");
    if (process.platform === "win32") {
      chromiumPath = path.join(chromiumDir, "chrome.exe");
    } else if (process.platform === "darwin") {
      chromiumPath = path.join(chromiumDir, "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing");
    } else {
      chromiumPath = path.join(chromiumDir, "chrome");
    }
  }
  return new Promise((resolve) => {
    var _a, _b;
    const child = fork(runnerPath, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      cwd: scriptsDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_PATH: VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "node_modules") : path.join(process.resourcesPath, "app", "node_modules"),
        ...chromiumPath ? { CHROMIUM_PATH: chromiumPath } : {}
      }
    });
    (_a = child.stdout) == null ? void 0 : _a.on("data", (data) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach((line) => win == null ? void 0 : win.webContents.send("script-log", line));
    });
    (_b = child.stderr) == null ? void 0 : _b.on("data", (data) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach((line) => win == null ? void 0 : win.webContents.send("script-log", `⚠️ ${line}`));
    });
    child.on("message", (msg) => {
      if (msg.type === "log") {
        win == null ? void 0 : win.webContents.send("script-log", msg.data);
      }
    });
    child.on("exit", (code) => {
      if (code === 0) resolve({ success: true });
      else resolve({ success: false, error: `Exit code: ${code}` });
    });
    child.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });
  });
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
