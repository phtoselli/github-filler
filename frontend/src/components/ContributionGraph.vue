<template>
  <div class="graph-wrapper">
    <!-- Toolbar (editor mode only) -->
    <div v-if="viewMode === 'editor'" class="toolbar">
      <div class="tool-group">
        <button
          class="tool-btn"
          :class="{ active: activeTool === 'cycle' }"
          @click="activeTool = 'cycle'"
          title="Clicar para ciclar nível"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/>
          </svg>
          Ciclar
        </button>
        <button
          class="tool-btn"
          :class="{ active: activeTool === 'paint' }"
          @click="activeTool = 'paint'"
          title="Pintar com nível fixo (arraste para pintar)"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M11.134 1.535C9.722 2.562 8.16 4.057 6.889 5.312 5.8 6.396 5.208 6.985 4.597 7.584c-.258.248-.47.48-.67.696-.178-.195-.393-.42-.63-.672A6 6 0 0 0 .8 5.344l-.394.867c.063.032.18.099.333.207a5 5 0 0 1 1.076 1.025c.273.34.5.703.63 1.09a3.5 3.5 0 0 1 .157 1.085c-.003.34-.077.7-.234 1.074a4.5 4.5 0 0 1-.597.932c-.206.239-.444.478-.702.717l-.07.065C.654 12.736 0 13.356 0 14.5c0 .828.672 1.5 1.5 1.5.742 0 1.303-.456 1.658-.848.234-.26.441-.556.614-.84.357-.59.614-1.252.614-1.812 0-.064-.004-.127-.014-.189.156-.18.327-.36.512-.545l.042-.042c.19-.187.39-.372.6-.558.328.347.642.665.942.96l.122.12c.449.44.86.842 1.182 1.222.282.332.508.66.582.992l.95-.19c-.12-.6-.504-1.078-.836-1.47-.368-.432-.81-.866-1.263-1.31l-.128-.125c-.25-.247-.503-.497-.753-.755.746-.728 1.395-1.315 2.503-2.381C9.36 7.2 10.922 5.706 12.335 4.68c.77-.56 1.416-.882 1.89-1.013.453-.125.636-.06.736.014.113.084.26.29.235.727-.024.417-.192 1.006-.574 1.755l.874.432c.41-.832.618-1.558.65-2.106.032-.533-.096-1.06-.476-1.344-.379-.283-.884-.283-1.39-.143-.523.145-1.2.478-2.14 1.162-.08.057-.16.118-.24.18ZM.75 14.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"/>
          </svg>
          Pintar
        </button>
        <button
          class="tool-btn"
          :class="{ active: activeTool === 'eraser' }"
          @click="activeTool = 'eraser'"
          title="Borracha (zerar nível)"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M5.334 4.545a1 1 0 0 0-1.414 0L.293 8.172a1 1 0 0 0 0 1.414l3.879 3.879a1 1 0 0 0 1.414 0l3.879-3.879a1 1 0 0 0 0-1.414L5.334 4.545Zm5.288-2.167a1 1 0 0 1 1.414 0l2.586 2.586a1 1 0 0 1 0 1.414L8.504 12.5H14.5a.5.5 0 0 1 0 1H5.77l-.147.146a2 2 0 0 1-2.828 0L1.5 12.354l3.71-3.71 5.412-5.412Z"/>
          </svg>
          Borracha
        </button>
      </div>
      <div v-if="activeTool === 'paint'" class="level-selector">
        <span class="level-label">Nível:</span>
        <button
          v-for="lvl in 4"
          :key="lvl"
          class="level-btn"
          :class="{ active: activeLevel === lvl }"
          :style="{ backgroundColor: activeLevel === lvl ? getColor(lvl) : 'transparent', borderColor: getColor(lvl) }"
          @click="activeLevel = lvl"
        >
          {{ lvl }}
        </button>
      </div>
      <div class="toolbar-hint">
        <span v-if="activeTool === 'paint' || activeTool === 'eraser'">Arraste para pintar</span>
        <span v-else>Shift+click para selecionar range</span>
      </div>
    </div>

    <!-- Real mode hint -->
    <div v-if="viewMode === 'real'" class="toolbar real-toolbar">
      <div class="real-hint">
        Clique nos quadrados para marcar/desmarcar datas para exclusão
      </div>
      <div v-if="markedCount > 0" class="marked-count">
        {{ markedCount }} {{ markedCount === 1 ? 'data marcada' : 'datas marcadas' }}
      </div>
    </div>

    <!-- Graph -->
    <div class="graph-container">
      <div class="day-labels">
        <div class="day-label" v-for="(label, i) in dayLabels" :key="i">{{ label }}</div>
      </div>
      <div class="graph-scroll">
        <div class="month-labels">
          <div
            v-for="ml in monthLabels"
            :key="ml.month"
            class="month-label"
            :style="{ gridColumn: ml.column + 1 }"
          >
            {{ ml.name }}
          </div>
        </div>
        <div
          class="grid"
          :style="gridStyle"
          @mousedown.prevent="onGridMouseDown"
          @mouseup="onGridMouseUp"
          @mouseleave="onGridMouseUp"
        >
          <template v-for="(row, rowIdx) in grid" :key="rowIdx">
            <div
              v-for="cell in row"
              :key="cell.column + '-' + rowIdx"
              class="cell"
              :class="{
                empty: !cell.date,
                'range-start': viewMode === 'editor' && cell.date && cell.date === rangeStart,
                'marked-delete': viewMode === 'real' && cell.date && isMarkedForDeletion(cell.date)
              }"
              :style="{
                backgroundColor: getCellColor(cell.date),
                gridRow: rowIdx + 1,
                gridColumn: cell.column + 1
              }"
              :data-date="cell.date || ''"
              @mousedown.prevent="handleMouseDown($event, cell.date)"
              @mouseenter="handleMouseEnter($event, cell.date)"
              @mouseover="showTooltip($event, cell.date)"
              @mouseleave="hideTooltip"
            />
          </template>
        </div>
      </div>
    </div>
    <div
      v-if="tooltip.visible"
      class="tooltip"
      :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
    >
      {{ tooltip.text }}
    </div>
    <div class="legend">
      <span class="legend-label">Menos</span>
      <div
        v-for="(color, i) in LEVEL_COLORS"
        :key="i"
        class="legend-cell"
        :style="{ backgroundColor: color }"
      />
      <span class="legend-label">Mais</span>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { generateGrid, getMonthLabels, monthName, dayLabel, formatDate } from '../utils/dates.js'
import { useGraph } from '../composables/useGraph.js'

const props = defineProps({
  year: { type: Number, required: true }
})

const {
  getLevel, cycleLevel, setLevel, getColor, applyTool,
  activeTool, activeLevel, viewMode,
  getRealLevel, realContributions, isMarkedForDeletion, toggleDeletion,
  getMarkedDates, LEVEL_COLORS
} = useGraph()

const grid = computed(() => generateGrid(props.year))

const totalColumns = computed(() => {
  let max = 0
  for (const row of grid.value) {
    for (const cell of row) {
      if (cell.column > max) max = cell.column
    }
  }
  return max + 1
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${totalColumns.value}, 13px)`,
  gridTemplateRows: 'repeat(7, 13px)'
}))

const monthLabels = computed(() => {
  return getMonthLabels(props.year).map(ml => ({
    ...ml,
    name: monthName(ml.month)
  }))
})

const dayLabels = computed(() => {
  return Array.from({ length: 7 }, (_, i) => dayLabel(i))
})

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  text: ''
})

const LEVEL_DESCRIPTIONS = [
  'Nenhuma contribuição',
  '1-2 contribuições',
  '2-4 contribuições',
  '4-6 contribuições',
  '6+ contribuições'
]

const markedCount = computed(() => getMarkedDates().length)

// Drag painting state
const isDragging = ref(false)

// Shift+click range selection
const rangeStart = ref(null)

function getCellColor(date) {
  if (viewMode.value === 'real') {
    const level = getRealLevel(date)
    if (isMarkedForDeletion(date)) {
      // Show a reddish tint for marked cells
      return level > 0 ? '#da3633' : '#161b22'
    }
    return getColor(level)
  }
  return getColor(getLevel(date))
}

function handleMouseDown(event, date) {
  if (!date) return

  if (viewMode.value === 'real') {
    // In real mode: toggle deletion mark
    if (getRealLevel(date) > 0 || isMarkedForDeletion(date)) {
      toggleDeletion(date)
    }
    isDragging.value = true
    return
  }

  // Editor mode behavior
  if (event.shiftKey && rangeStart.value && activeTool.value !== 'eraser') {
    applyRange(rangeStart.value, date)
    rangeStart.value = null
    return
  }

  if (activeTool.value === 'cycle') {
    rangeStart.value = date
    cycleLevel(date)
  } else {
    isDragging.value = true
    applyTool(date)
  }
}

function handleMouseEnter(event, date) {
  if (!date) return

  if (viewMode.value === 'real') {
    if (isDragging.value && (getRealLevel(date) > 0) && !isMarkedForDeletion(date)) {
      toggleDeletion(date)
    }
    return
  }

  if (isDragging.value && activeTool.value !== 'cycle') {
    applyTool(date)
  }
}

function onGridMouseDown() {
  // Handled per-cell
}

function onGridMouseUp() {
  isDragging.value = false
}

function applyRange(startDate, endDate) {
  const allDates = []
  for (const row of grid.value) {
    for (const cell of row) {
      if (cell.date) allDates.push(cell.date)
    }
  }
  allDates.sort()

  const from = startDate < endDate ? startDate : endDate
  const to = startDate < endDate ? endDate : startDate

  for (const d of allDates) {
    if (d >= from && d <= to) {
      if (activeTool.value === 'paint') {
        setLevel(d, activeLevel.value)
      } else {
        setLevel(d, activeLevel.value)
      }
    }
  }
}

function showTooltip(event, date) {
  if (!date) return

  if (viewMode.value === 'real') {
    const count = realContributions[date] || 0
    const marked = isMarkedForDeletion(date)
    tooltip.visible = true
    tooltip.text = `${formatDate(date)} — ${count} commits${marked ? ' (marcado para exclusão)' : ''}`
  } else {
    const level = getLevel(date)
    tooltip.visible = true
    tooltip.text = `${formatDate(date)} — ${LEVEL_DESCRIPTIONS[level]}`
  }

  const rect = event.target.getBoundingClientRect()
  tooltip.x = rect.left + rect.width / 2
  tooltip.y = rect.top - 8
}

function hideTooltip() {
  tooltip.visible = false
}
</script>

<style scoped>
.graph-wrapper {
  position: relative;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.real-toolbar {
  background: rgba(218, 54, 51, 0.08);
  border: 1px solid rgba(218, 54, 51, 0.2);
  border-radius: 6px;
  padding: 8px 12px;
}

.real-hint {
  font-size: 12px;
  color: #f85149;
}

.marked-count {
  font-size: 12px;
  color: #da3633;
  font-weight: 600;
  margin-left: auto;
}

.tool-group {
  display: flex;
  gap: 2px;
  background: #0d1117;
  border-radius: 6px;
  padding: 2px;
  border: 1px solid #21262d;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #8b949e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
}

.tool-btn:hover {
  color: #c9d1d9;
  background: #161b22;
}

.tool-btn.active {
  background: #21262d;
  color: #f0f6fc;
}

.level-selector {
  display: flex;
  align-items: center;
  gap: 4px;
}

.level-label {
  font-size: 12px;
  color: #8b949e;
  margin-right: 2px;
}

.level-btn {
  width: 24px;
  height: 24px;
  border: 2px solid;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.12s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-btn:not(.active) {
  color: #8b949e;
}

.level-btn.active {
  box-shadow: 0 0 0 2px rgba(56, 139, 253, 0.4);
}

.toolbar-hint {
  font-size: 11px;
  color: #484f58;
  margin-left: auto;
}

.graph-container {
  display: flex;
  gap: 4px;
}

.day-labels {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 22px;
}

.day-label {
  height: 13px;
  font-size: 10px;
  color: #8b949e;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 4px;
  min-width: 28px;
}

.graph-scroll {
  overflow-x: auto;
  padding-left: 2px;
  scrollbar-width: thin;
  scrollbar-color: #30363d transparent;
}

.graph-scroll::-webkit-scrollbar {
  height: 6px;
}

.graph-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.graph-scroll::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 3px;
}

.graph-scroll::-webkit-scrollbar-thumb:hover {
  background: #484f58;
}

.month-labels {
  display: grid;
  grid-template-rows: 1fr;
  height: 18px;
  margin-bottom: 4px;
}

.month-label {
  font-size: 10px;
  color: #8b949e;
}

.grid {
  display: grid;
  gap: 3px;
  user-select: none;
}

.cell {
  width: 13px;
  height: 13px;
  border-radius: 2px;
  cursor: pointer;
  outline: 1px solid rgba(139, 148, 158, 0.3);
  transition: outline-color 0.1s;
}

.cell:hover {
  outline-color: rgba(255, 255, 255, 0.5);
}

.cell.empty {
  visibility: hidden;
  cursor: default;
}

.cell.range-start {
  outline: 2px solid #58a6ff;
}

.cell.marked-delete {
  outline: 2px solid #f85149;
}

.tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background: #24292f;
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  margin-top: 12px;
}

.legend-label {
  font-size: 11px;
  color: #8b949e;
}

.legend-cell {
  width: 13px;
  height: 13px;
  border-radius: 2px;
  outline: 1px solid rgba(27, 31, 35, 0.06);
}
</style>
