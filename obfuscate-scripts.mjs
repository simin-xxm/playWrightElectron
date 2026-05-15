// 混淆 scripts/ 目录下的脚本，输出到 dist-scripts/
import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join, basename } from 'path';

const srcDir = 'scripts';
const outDir = 'dist-scripts';

mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir);

for (const file of files) {
  const src = join(srcDir, file);
  const dest = join(outDir, file);

  if (file.endsWith('.cjs') && !file.startsWith('script-runner')) {
    // 混淆业务脚本
    const code = readFileSync(src, 'utf-8');
    const result = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.5,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      identifierNamesGenerator: 'hexadecimal',
      splitStrings: true,
      splitStringsChunkLength: 5,
    });
    writeFileSync(dest, result.getObfuscatedCode(), 'utf-8');
    console.log(`✓ 混淆: ${file}`);
  } else {
    // script-runner.cjs 等直接复制
    copyFileSync(src, dest);
    console.log(`✓ 复制: ${file}`);
  }
}

console.log('脚本处理完成 -> dist-scripts/');
