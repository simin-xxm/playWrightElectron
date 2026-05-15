import { app as f, BrowserWindow as j, Menu as S, ipcMain as E } from "electron";
import { fileURLToPath as v } from "node:url";
import s from "node:path";
import m from "node:fs";
const w = s.dirname(v(import.meta.url));
process.env.APP_ROOT = s.join(w, "..");
const c = process.env.VITE_DEV_SERVER_URL, M = s.join(process.env.APP_ROOT, "dist-electron"), R = s.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = c ? s.join(process.env.APP_ROOT, "public") : R;
let e;
function g() {
  e = new j({
    width: 1600,
    height: 1e3,
    minWidth: 800,
    minHeight: 600,
    icon: s.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: s.join(w, "preload.mjs")
    }
  }), process.platform === "win32" && (e.setMenuBarVisibility(!1), e.setAutoHideMenuBar(!0)), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), c ? e.loadURL(c) : e.loadFile(s.join(R, "index.html"));
}
f.on("window-all-closed", () => {
  process.platform !== "darwin" && (f.quit(), e = null);
});
f.on("activate", () => {
  j.getAllWindows().length === 0 && g();
});
f.whenReady().then(() => {
  process.platform === "win32" && S.setApplicationMenu(null), g();
});
function T() {
  return c ? s.join(process.env.APP_ROOT, "scripts") : s.join(process.resourcesPath, "scripts");
}
E.handle("get-scripts", async () => {
  const a = T();
  if (!m.existsSync(a)) return [];
  const h = m.readdirSync(a).filter((t) => (t.endsWith(".js") || t.endsWith(".cjs")) && !t.startsWith("script-runner")), r = [];
  for (const t of h) {
    const l = m.readFileSync(s.join(a, t), "utf-8"), d = l.match(/name:\s*['"](.+?)['"]/), n = l.match(/description:\s*['"](.+?)['"]/);
    r.push({
      file: t,
      name: d ? d[1] : t,
      description: n ? n[1] : ""
    });
  }
  return r;
});
E.handle("run-script", async (a, h) => {
  const r = T(), t = s.join(r, h);
  if (!t.startsWith(r))
    throw new Error("Invalid script path");
  if (!m.existsSync(t))
    throw new Error("Script not found");
  const { fork: l } = await import("node:child_process"), d = s.join(r, "script-runner.cjs");
  let n;
  if (!c) {
    const i = s.join(process.resourcesPath, "chromium");
    process.platform === "win32" ? n = s.join(i, "chrome.exe") : process.platform === "darwin" ? n = s.join(i, "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing") : n = s.join(i, "chrome");
  }
  return new Promise((i) => {
    var _, P;
    const p = l(d, [t], {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      cwd: r,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_PATH: c ? s.join(process.env.APP_ROOT, "node_modules") : s.join(process.resourcesPath, "app", "node_modules"),
        ...n ? { CHROMIUM_PATH: n } : {}
      }
    });
    (_ = p.stdout) == null || _.on("data", (o) => {
      o.toString().trim().split(`
`).forEach((u) => e == null ? void 0 : e.webContents.send("script-log", u));
    }), (P = p.stderr) == null || P.on("data", (o) => {
      o.toString().trim().split(`
`).forEach((u) => e == null ? void 0 : e.webContents.send("script-log", `⚠️ ${u}`));
    }), p.on("message", (o) => {
      o.type === "log" && (e == null || e.webContents.send("script-log", o.data));
    }), p.on("exit", (o) => {
      i(o === 0 ? { success: !0 } : { success: !1, error: `Exit code: ${o}` });
    }), p.on("error", (o) => {
      i({ success: !1, error: o.message });
    });
  });
});
export {
  M as MAIN_DIST,
  R as RENDERER_DIST,
  c as VITE_DEV_SERVER_URL
};
