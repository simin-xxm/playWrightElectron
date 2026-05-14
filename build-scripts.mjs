// 构建脚本：将 scripts/*.ts 和 electron/script-runner.ts 编译为 JS
import { build } from 'esbuild'
import { readdirSync, mkdirSync } from 'fs'
import { join } from 'path'

// 确保输出目录存在
mkdirSync('dist-scripts', { recursive: true })

// 编译所有脚本
const scripts = readdirSync('scripts').filter(f => f.endsWith('.ts'))
const entryPoints = scripts.map(f => join('scripts', f))

await build({
  entryPoints,
  outdir: 'dist-scripts',
  platform: 'node',
  format: 'cjs',
  bundle: true,
  external: ['playwright', 'playwright-core'],
})

// 编译 script-runner
await build({
  entryPoints: ['electron/script-runner.ts'],
  outfile: 'dist-scripts/script-runner.js',
  platform: 'node',
  format: 'cjs',
  bundle: false,
})

console.log('✓ Scripts compiled to dist-scripts/')
