<template>
  <div class="save-section">
    <button class="save-btn" :disabled="saving" @click="handleSave">
      <span v-if="saving" class="spinner" />
      {{ saving ? 'Gerando commits...' : 'Salvar no GitHub' }}
    </button>
    <div v-if="status" class="status" :class="status.type">
      {{ status.message }}
    </div>
    <div v-if="saving && progress" class="progress-info">
      {{ progress }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGraph } from '../composables/useGraph.js'

const props = defineProps({
  year: { type: Number, required: true }
})

const { getContributions } = useGraph()

const saving = ref(false)
const status = ref(null)
const progress = ref('')

async function handleSave() {
  const settingsRaw = localStorage.getItem('github-filler-settings')
  if (!settingsRaw) {
    status.value = { type: 'error', message: 'Configure o repositório e SSH nas configurações primeiro.' }
    return
  }

  const settings = JSON.parse(settingsRaw)
  if (!settings.repoUrl || !settings.sshKey || !settings.userName || !settings.userEmail) {
    status.value = { type: 'error', message: 'Preencha todos os campos nas configurações.' }
    return
  }

  const contributions = getContributions(props.year)
  if (Object.keys(contributions).length === 0) {
    status.value = { type: 'error', message: 'Nenhuma contribuição marcada no gráfico.' }
    return
  }

  saving.value = true
  status.value = null
  progress.value = `Processando ${Object.keys(contributions).length} dias com contribuições...`

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoUrl: settings.repoUrl,
        sshKey: settings.sshKey,
        userName: settings.userName,
        userEmail: settings.userEmail,
        contributions
      })
    })

    const data = await res.json()

    if (res.ok) {
      status.value = { type: 'success', message: `Commits criados e enviados com sucesso! (${data.totalCommits} commits)` }
    } else {
      status.value = { type: 'error', message: data.error || 'Erro ao gerar commits.' }
    }
  } catch (err) {
    status.value = { type: 'error', message: `Erro de conexão: ${err.message}` }
  } finally {
    saving.value = false
    progress.value = ''
  }
}
</script>

<style scoped>
.save-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #238636;
  border: 1px solid rgba(240, 246, 252, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.save-btn:hover:not(:disabled) {
  background: #2ea043;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.status.success {
  background: rgba(35, 134, 54, 0.15);
  color: #3fb950;
  border: 1px solid rgba(35, 134, 54, 0.3);
}

.status.error {
  background: rgba(248, 81, 73, 0.1);
  color: #f85149;
  border: 1px solid rgba(248, 81, 73, 0.2);
}

.progress-info {
  font-size: 12px;
  color: #8b949e;
}
</style>
