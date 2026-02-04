<template>
  <div class="app">
    <header>
      <div class="header-left">
        <svg class="logo" viewBox="0 0 16 16" width="28" height="28" fill="#c9d1d9">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
        </svg>
        <h1>GitHub Filler</h1>
      </div>
      <div class="header-right">
        <!-- Mode toggle -->
        <div class="mode-toggle">
          <button
            class="mode-btn"
            :class="{ active: viewMode === 'editor' }"
            @click="switchToEditor"
          >
            Editor
          </button>
          <button
            class="mode-btn mode-btn-real"
            :class="{ active: viewMode === 'real' }"
            @click="switchToReal"
          >
            <span v-if="realLoading" class="spinner-small" />
            Gráfico Real
          </button>
        </div>
        <button class="settings-btn" @click="showSettings = true" title="Configurações">
          <svg viewBox="0 0 16 16" width="20" height="20" fill="#8b949e">
            <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294a6.7 6.7 0 0 1 0 .772c-.01.147.04.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.2 7.2 0 0 1-.704 1.218c-.428.609-1.176.806-1.82.63l-1.103-.303c-.066-.019-.176-.011-.299.071a5.4 5.4 0 0 1-.668.386c-.133.066-.194.158-.212.224l-.288 1.107c-.169.645-.715 1.196-1.458 1.26a8.1 8.1 0 0 1-1.402 0c-.743-.064-1.29-.614-1.458-1.26l-.289-1.106c-.017-.066-.078-.158-.211-.224a5.4 5.4 0 0 1-.668-.387c-.123-.082-.233-.09-.3-.071l-1.102.303c-.644.176-1.392-.021-1.82-.63a7.1 7.1 0 0 1-.704-1.217c-.315-.675-.111-1.422.363-1.891l.815-.806c.049-.048.098-.147.088-.294a6.7 6.7 0 0 1 0-.772c.01-.147-.04-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.1 7.1 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.103.303c.066.018.176.011.299-.072.214-.143.437-.272.668-.386.133-.066.194-.158.212-.224L5.84 1.29c.17-.645.715-1.196 1.458-1.26A8.2 8.2 0 0 1 8 0ZM5.5 8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z"/>
          </svg>
        </button>
      </div>
    </header>

    <main>
      <section class="section">
        <YearSelector v-model="selectedYear" :startYear="startYear" />
      </section>

      <section class="section graph-section" :class="{ 'graph-section-real': viewMode === 'real' }">
        <ContributionGraph :year="selectedYear" />
      </section>

      <!-- Editor mode controls -->
      <template v-if="viewMode === 'editor'">
        <section class="section">
          <RandomFill :year="selectedYear" />
        </section>

        <section class="section">
          <SaveButton :year="selectedYear" />
        </section>
      </template>

      <!-- Real mode controls -->
      <template v-if="viewMode === 'real'">
        <section class="section">
          <DeletePanel />
        </section>
      </template>
    </main>

    <SettingsModal
      :visible="showSettings"
      @close="showSettings = false"
      @saved="onSettingsSaved"
    />

    <div v-if="fetchError" class="fetch-error">
      {{ fetchError }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ContributionGraph from './components/ContributionGraph.vue'
import YearSelector from './components/YearSelector.vue'
import SettingsModal from './components/SettingsModal.vue'
import RandomFill from './components/RandomFill.vue'
import SaveButton from './components/SaveButton.vue'
import DeletePanel from './components/DeletePanel.vue'
import { useGraph } from './composables/useGraph.js'

const { selectedYear, viewMode, realLoading, loadRealContributions, clearDeletionMarks } = useGraph()

const showSettings = ref(false)
const startYear = ref(2020)
const fetchError = ref('')

onMounted(() => {
  const saved = localStorage.getItem('github-filler-settings')
  if (saved) {
    const settings = JSON.parse(saved)
    if (settings.accountYear) {
      startYear.value = settings.accountYear
    }
  }
})

function onSettingsSaved(settings) {
  if (settings.accountYear) {
    startYear.value = settings.accountYear
  }
}

function switchToEditor() {
  viewMode.value = 'editor'
  clearDeletionMarks()
  fetchError.value = ''
}

async function switchToReal() {
  fetchError.value = ''
  try {
    await loadRealContributions()
    viewMode.value = 'real'
    clearDeletionMarks()
  } catch (err) {
    fetchError.value = err.message
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0d1117;
  color: #c9d1d9;
  min-height: 100vh;
}

.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #21262d;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  flex-shrink: 0;
}

header h1 {
  font-size: 22px;
  font-weight: 600;
  color: #f0f6fc;
}

.mode-toggle {
  display: flex;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.mode-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #8b949e;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.12s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mode-btn:hover {
  color: #c9d1d9;
}

.mode-btn.active {
  background: #21262d;
  color: #f0f6fc;
}

.mode-btn-real.active {
  background: rgba(218, 54, 51, 0.15);
  color: #f85149;
}

.spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.settings-btn {
  background: none;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.settings-btn:hover {
  border-color: #8b949e;
}

.settings-btn:hover svg {
  fill: #c9d1d9;
}

main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  /* spacing is handled by gap */
}

.graph-section {
  overflow-x: auto;
  padding: 16px;
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 8px;
}

.graph-section-real {
  border-color: rgba(218, 54, 51, 0.3);
}

.fetch-error {
  margin-top: 16px;
  padding: 10px 14px;
  background: rgba(248, 81, 73, 0.1);
  color: #f85149;
  border: 1px solid rgba(248, 81, 73, 0.2);
  border-radius: 6px;
  font-size: 13px;
}
</style>
