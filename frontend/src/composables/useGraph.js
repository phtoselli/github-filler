import { ref, reactive, computed } from 'vue'

const LEVEL_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']

// State stored per year: { 'YYYY-MM-DD': level }
const graphData = reactive({})
const selectedYear = ref(new Date().getFullYear())

// Tool state: 'paint' | 'eraser' | 'cycle'
const activeTool = ref('cycle')
const activeLevel = ref(3)

// View mode: 'editor' | 'real'
const viewMode = ref('editor')

// Real contributions from repo: { 'YYYY-MM-DD': commitCount }
const realContributions = reactive({})
const realLoading = ref(false)

// Dates marked for deletion in real mode
const markedForDeletion = reactive({})

export function useGraph() {
  function ensureYear(year) {
    if (!graphData[year]) {
      graphData[year] = {}
    }
  }

  function getLevel(date) {
    if (!date) return 0
    const year = parseInt(date.split('-')[0], 10)
    ensureYear(year)
    return graphData[year][date] || 0
  }

  function cycleLevel(date) {
    if (!date) return
    const year = parseInt(date.split('-')[0], 10)
    ensureYear(year)
    const current = graphData[year][date] || 0
    graphData[year][date] = current >= 4 ? 0 : current + 1
  }

  function setLevel(date, level) {
    if (!date) return
    const year = parseInt(date.split('-')[0], 10)
    ensureYear(year)
    graphData[year][date] = level
  }

  function clearYear(year) {
    graphData[year] = {}
  }

  function getColor(level) {
    return LEVEL_COLORS[level] || LEVEL_COLORS[0]
  }

  function getContributions(year) {
    ensureYear(year)
    const result = {}
    for (const [date, level] of Object.entries(graphData[year])) {
      if (level > 0) {
        result[date] = level
      }
    }
    return result
  }

  function applyTool(date) {
    if (!date) return
    if (activeTool.value === 'eraser') {
      setLevel(date, 0)
    } else if (activeTool.value === 'paint') {
      setLevel(date, activeLevel.value)
    } else {
      cycleLevel(date)
    }
  }

  // Convert commit count to a display level (0-4)
  function commitCountToLevel(count) {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 4) return 2
    if (count <= 6) return 3
    return 4
  }

  function getRealLevel(date) {
    if (!date) return 0
    return commitCountToLevel(realContributions[date] || 0)
  }

  function toggleDeletion(date) {
    if (!date) return
    if (markedForDeletion[date]) {
      delete markedForDeletion[date]
    } else {
      markedForDeletion[date] = true
    }
  }

  function isMarkedForDeletion(date) {
    return !!markedForDeletion[date]
  }

  function clearDeletionMarks() {
    for (const key of Object.keys(markedForDeletion)) {
      delete markedForDeletion[key]
    }
  }

  function getMarkedDates() {
    return Object.keys(markedForDeletion)
  }

  function markAllForDeletion() {
    for (const [date, count] of Object.entries(realContributions)) {
      if (count > 0) {
        markedForDeletion[date] = true
      }
    }
  }

  async function loadRealContributions() {
    const settingsRaw = localStorage.getItem('github-filler-settings')
    if (!settingsRaw) throw new Error('Configure o repositório nas configurações.')

    const settings = JSON.parse(settingsRaw)
    if (!settings.repoUrl || !settings.sshKey) {
      throw new Error('Repositório e chave SSH são obrigatórios.')
    }

    realLoading.value = true
    try {
      const res = await fetch('/api/fetch-contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: settings.repoUrl,
          sshKey: settings.sshKey
        })
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Backend não respondeu. Verifique se o servidor está rodando (npm run dev).')
      }
      if (!res.ok) throw new Error(data.error)

      // Clear and repopulate
      for (const key of Object.keys(realContributions)) {
        delete realContributions[key]
      }
      Object.assign(realContributions, data.contributions)
    } finally {
      realLoading.value = false
    }
  }

  return {
    graphData,
    selectedYear,
    activeTool,
    activeLevel,
    viewMode,
    realContributions,
    realLoading,
    markedForDeletion,
    getLevel,
    cycleLevel,
    setLevel,
    clearYear,
    getColor,
    getContributions,
    applyTool,
    getRealLevel,
    toggleDeletion,
    isMarkedForDeletion,
    clearDeletionMarks,
    getMarkedDates,
    markAllForDeletion,
    loadRealContributions,
    LEVEL_COLORS
  }
}
