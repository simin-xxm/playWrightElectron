// 脚本运行器 - 在子进程中执行 Playwright 脚本
const scriptPath = process.argv[2]

async function run() {
  const scriptUrl = require('url').pathToFileURL(scriptPath).href
  const script = await import(scriptUrl)
  const mod = script.default || script

  const onLog = (msg) => {
    if (process.send) {
      process.send({ type: 'log', data: msg })
    }
  }

  await mod.run(onLog)
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    if (process.send) {
      process.send({ type: 'log', data: `错误: ${err.message}` })
    }
    console.error(err)
    process.exit(1)
  })
