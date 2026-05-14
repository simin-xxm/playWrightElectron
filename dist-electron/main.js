import { app as f, BrowserWindow as E, ipcMain as P } from "electron";
import { fileURLToPath as g } from "node:url";
import s from "node:path";
import l from "node:fs";
const R = s.dirname(g(import.meta.url));
process.env.APP_ROOT = s.join(R, "..");
const c = process.env.VITE_DEV_SERVER_URL, I = s.join(process.env.APP_ROOT, "dist-electron"), j = s.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = c ? s.join(process.env.APP_ROOT, "public") : j;
let e;
function w() {
  e = new E({
    icon: s.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: s.join(R, "preload.mjs")
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), c ? e.loadURL(c) : e.loadFile(s.join(j, "index.html"));
}
f.on("window-all-closed", () => {
  process.platform !== "darwin" && (f.quit(), e = null);
});
f.on("activate", () => {
  E.getAllWindows().length === 0 && w();
});
f.whenReady().then(w);
function O() {
  return c ? s.join(process.env.APP_ROOT, "scripts") : s.join(process.resourcesPath, "scripts");
}
P.handle("get-scripts", async () => {
  const p = O();
  if (!l.existsSync(p)) return [];
  const m = l.readdirSync(p).filter((t) => t.endsWith(".js") && t !== "script-runner.js"), o = [];
  for (const t of m) {
    const a = l.readFileSync(s.join(p, t), "utf-8"), d = a.match(/name:\s*['"](.+?)['"]/), r = a.match(/description:\s*['"](.+?)['"]/);
    o.push({
      file: t,
      name: d ? d[1] : t,
      description: r ? r[1] : ""
    });
  }
  return o;
});
P.handle("run-script", async (p, m) => {
  const o = O(), t = s.join(o, m);
  if (!t.startsWith(o))
    throw new Error("Invalid script path");
  if (!l.existsSync(t))
    throw new Error("Script not found");
  const { fork: a } = await import("node:child_process"), d = s.join(o, "script-runner.js");
  return new Promise((r) => {
    var h, _;
    const i = a(d, [t], {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      cwd: o,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_PATH: c ? s.join(process.env.APP_ROOT, "node_modules") : s.join(process.resourcesPath, "app", "node_modules")
      }
    });
    (h = i.stdout) == null || h.on("data", (n) => {
      n.toString().trim().split(`
`).forEach((u) => e == null ? void 0 : e.webContents.send("script-log", u));
    }), (_ = i.stderr) == null || _.on("data", (n) => {
      n.toString().trim().split(`
`).forEach((u) => e == null ? void 0 : e.webContents.send("script-log", `⚠️ ${u}`));
    }), i.on("message", (n) => {
      n.type === "log" && (e == null || e.webContents.send("script-log", n.data));
    }), i.on("exit", (n) => {
      r(n === 0 ? { success: !0 } : { success: !1, error: `Exit code: ${n}` });
    }), i.on("error", (n) => {
      r({ success: !1, error: n.message });
    });
  });
});
export {
  I as MAIN_DIST,
  j as RENDERER_DIST,
  c as VITE_DEV_SERVER_URL
};
