<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ScriptInfo {
  file: string
  name: string
  description: string
}

const scripts = ref<ScriptInfo[]>([])
const logs = ref<string[]>([])
const running = ref(false)

async function loadScripts() {
  scripts.value = await (window as any).ipcRenderer.invoke('get-scripts')
}

async function runScript(script: ScriptInfo) {
  running.value = true
  logs.value = []
  logs.value.push(`▶ 开始运行: ${script.name}`)

  const result = await (window as any).ipcRenderer.invoke('run-script', script.file)

  if (result.success) {
    logs.value.push('✅ 脚本执行完成')
  } else {
    logs.value.push(`❌ 脚本执行失败: ${result.error}`)
  }
  running.value = false
}

onMounted(() => {
  loadScripts()
  ;(window as any).ipcRenderer.on('script-log', (_: any, msg: string) => {
    logs.value.push(msg)
  })
})
</script>

<template>
  <div class="container">
    <h1>🎭 Playwright 脚本管理器</h1>

    <div class="scripts-list">
      <h2>可用脚本</h2>
      <div v-if="scripts.length === 0" class="empty">暂无脚本</div>
      <div
        v-for="script in scripts"
        :key="script.file"
        class="script-card"
        @click="!running && runScript(script)"
        :class="{ disabled: running }"
      >
        <div class="script-name">{{ script.name }}</div>
        <div class="script-desc">{{ script.description }}</div>
        <div class="script-file">{{ script.file }}</div>
      </div>
    </div>

    <div class="logs-panel" v-if="logs.length > 0">
      <h2>运行日志 <span v-if="running" class="running-badge">运行中...</span></h2>
      <div class="logs">
        <div v-for="(log, i) in logs" :key="i" class="log-line">{{ log }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}
h1 { text-align: center; margin-bottom: 24px; }
.script-card {
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.script-card:hover:not(.disabled) {
  border-color: #646cff;
  background: #1a1a2e;
}
.script-card.disabled { opacity: 0.5; cursor: not-allowed; }
.script-name { font-size: 16px; font-weight: bold;  }
.script-desc { font-size: 13px; color: #aaa; margin-top: 4px; }
.script-file { font-size: 11px; color: #666; margin-top: 4px; font-family: monospace; }
.logs-panel { margin-top: 20px; }
.logs {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 13px;
}
.log-line { padding: 2px 0; color: #ccc; }
.running-badge { font-size: 12px; color: #4caf50; animation: pulse 1s infinite; }
.empty { color: #666; text-align: center; padding: 20px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
