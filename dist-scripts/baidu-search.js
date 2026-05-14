"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scripts/baidu-search.ts
var baidu_search_exports = {};
__export(baidu_search_exports, {
  default: () => baidu_search_default
});
module.exports = __toCommonJS(baidu_search_exports);
var import_playwright = require("playwright");
var baidu_search_default = {
  name: "\u6D4B\u8BD5kics\u767B\u5F55",
  description: "\u6D4B\u8BD5kics\u767B\u5F55",
  async run(onLog) {
    onLog("\u542F\u52A8\u6D4F\u89C8\u5668...");
    const browser = await import_playwright.chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://h.kanglailab.com/login");
    await page.fill("#form_item_userName", "lhq");
    await page.fill("#form_item_password", "1234567");
    await page.click('button:has-text("\u767B \u5F55")');
    await page.locator('[data-menu-id="/equip"] .ant-menu-title-content').click();
    await page.waitForTimeout(1e3);
    await page.locator('[data-menu-id="/equip/printerManagement"]').click();
    await page.click('button:has-text("\u6807\u672C\u7BB1\u6E29\u5EA6\u6253\u5370")');
    onLog("\u811A\u672C\u6267\u884C\u5B8C\u6BD5\uFF0C\u7B49\u5F85\u624B\u52A8\u5173\u95ED\u6D4F\u89C8\u5668...");
    await page.waitForEvent("close", { timeout: 0 }).catch(() => {
    });
    await browser.close().catch(() => {
    });
  }
};
