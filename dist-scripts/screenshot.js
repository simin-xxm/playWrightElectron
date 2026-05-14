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

// scripts/screenshot.ts
var screenshot_exports = {};
__export(screenshot_exports, {
  default: () => screenshot_default
});
module.exports = __toCommonJS(screenshot_exports);
var import_playwright = require("playwright");
var screenshot_default = {
  name: "\u622A\u56FE\u793A\u4F8B",
  description: "\u6253\u5F00\u7F51\u9875\u5E76\u622A\u56FE\u4FDD\u5B58",
  async run(onLog) {
    onLog("\u542F\u52A8\u6D4F\u89C8\u5668...");
    const browser = await import_playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    onLog("\u6253\u5F00\u9875\u9762...");
    await page.goto("https://example.com");
    onLog("\u622A\u56FE\u4E2D...");
    await page.screenshot({ path: "screenshot.png", fullPage: true });
    onLog("\u622A\u56FE\u5DF2\u4FDD\u5B58\u4E3A screenshot.png");
    await browser.close();
    onLog("\u5B8C\u6210");
  }
};
