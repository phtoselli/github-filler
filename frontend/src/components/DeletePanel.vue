<template>
  <div class="delete-panel">
    <div class="panel-header">
      <h3>Excluir Contribuições</h3>
      <p class="panel-desc">
        Marque os dias no gráfico acima e clique em "Excluir" para remover os commits dessas datas do repositório.
        Essa ação reescreve o histórico do git e faz force push.
      </p>
    </div>

    <div class="panel-actions">
      <button
        class="btn delete-btn"
        :disabled="markedCount === 0 || deleting"
        @click="handleDelete"
      >
        <span v-if="deleting" class="spinner" />
        {{ deleting ? 'Excluindo...' : `Excluir ${markedCount} ${markedCount === 1 ? 'data' : 'datas'}` }}
      </button>
      <button
        class="btn select-all-btn"
        :disabled="deleting"
        @click="markAllForDeletion"
      >
        Selecionar Todos
      </button>
      <button
        class="btn clear-marks-btn"
        :disabled="markedCount === 0 || deleting"
        @click="clearDeletionMarks"
      >
        Limpar Seleção
      </button>
    </div>

    <div v-if="status" class="status" :class="status.type">
      {{ status.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGraph } from '../composables/useGraph.js'

const {
  getMarkedDates, clearDeletionMarks, markAllForDeletion, loadRealContributions
} = useGraph()

const deleting = ref(false)
const status = ref(null)

const markedCount = computed(() => getMarkedDates().length)

async function handleDelete() {
  const dates = getMarkedDates()
  if (dates.length === 0) return

  const settingsRaw = localStorage.getItem('github-filler-settings')
  if (!settingsRaw) {
    status.value = { type: 'error', message: 'Configure o repositório nas configurações.' }
    return
  }

  const settings = JSON.parse(settingsRaw)
  if (!settings.repoUrl || !settings.sshKey) {
    status.value = { type: 'error', message: 'Repositório e chave SSH são obrigatórios.' }
    return
  }

  deleting.value = true
  status.value = null

  try {
    const res = await fetch('/api/delete-contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoUrl: settings.repoUrl,
        sshKey: settings.sshKey,
        datesToDelete: dates
      })
    })

    const data = await res.json()

    if (res.ok) {
      status.value = {
        type: 'success',
        message: `${data.deletedCommits} commits removidos com sucesso.`
      }
      clearDeletionMarks()
      // Reload the real contributions to reflect the changes
      await loadRealContributions()
    } else {
      status.value = { type: 'error', message: data.error || 'Erro ao excluir.' }
    }
  } catch (err) {
    status.value = { type: 'error', message: `Erro de conexão: ${err.message}` }
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.delete-panel {
  border: 1px solid rgba(218, 54, 51, 0.2);
  border-radius: 8px;
  padding: 16px;
  background: rgba(218, 54, 51, 0.04);
}

.panel-header {
  margin-bottom: 14px;
}

.panel-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #f85149;
  margin: 0 0 6px;
}

.panel-desc {
  font-size: 12px;
  color: #8b949e;
  line-height: 1.5;
}

.panel-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.delete-btn {
  background: #da3633;
  border-color: rgba(240, 246, 252, 0.1);
  color: #fff;
}

.delete-btn:hover:not(:disabled) {
  background: #f85149;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-all-btn {
  background: transparent;
  border-color: rgba(218, 54, 51, 0.4);
  color: #f85149;
}

.select-all-btn:hover:not(:disabled) {
  background: rgba(218, 54, 51, 0.1);
}

.select-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-marks-btn {
  background: transparent;
  border-color: #30363d;
  color: #c9d1d9;
}

.clear-marks-btn:hover:not(:disabled) {
  background: #21262d;
}

.clear-marks-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 12px;
  height: 12px;
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
</style>
