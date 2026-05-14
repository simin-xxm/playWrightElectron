"use strict";
const scriptPath = process.argv[2];
async function run() {
  const script = await import(scriptPath);
  const mod = script.default || script;
  const onLog = (msg) => {
    if (process.send) {
      process.send({ type: "log", data: msg });
    }
  };
  await mod.run(onLog);
}
run().then(() => process.exit(0)).catch((err) => {
  if (process.send) {
    process.send({ type: "log", data: `\u9519\u8BEF: ${err.message}` });
  }
  console.error(err);
  process.exit(1);
});
