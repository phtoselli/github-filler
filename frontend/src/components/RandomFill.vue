<template>
  <div class="random-fill">
    <h3>Preenchimento Aleatório</h3>
    <div class="controls">
      <div class="field">
        <label>Nível mínimo</label>
        <select v-model.number="minLevel">
          <option :value="0">0 - Nenhuma</option>
          <option :value="1">1 - Baixa</option>
          <option :value="2">2 - Média</option>
          <option :value="3">3 - Alta</option>
          <option :value="4">4 - Máxima</option>
        </select>
      </div>
      <div class="field">
        <label>Nível máximo</label>
        <select v-model.number="maxLevel">
          <option :value="1">1 - Baixa</option>
          <option :value="2">2 - Média</option>
          <option :value="3">3 - Alta</option>
          <option :value="4">4 - Máxima</option>
        </select>
      </div>
    </div>
    <div class="exclude-days">
      <label>Excluir dias:</label>
      <div class="day-checks">
        <label v-for="(name, idx) in dayNames" :key="idx" class="checkbox-label">
          <input type="checkbox" :value="idx" v-model="excludeDays" />
          {{ name }}
        </label>
      </div>
    </div>
    <div class="actions">
      <button class="btn fill-btn" @click="fill">Preencher Aleatoriamente</button>
      <button class="btn clear-btn" @click="clear">Limpar Ano</button>
    </div>

    <div class="presets">
      <label>Presets:</label>
      <div class="preset-btns">
        <button class="btn preset-btn" @click="applyPreset('casual')">
          Casual
          <span class="preset-desc">Baixa intensidade, sem fins de semana</span>
        </button>
        <button class="btn preset-btn" @click="applyPreset('intenso')">
          Intenso
          <span class="preset-desc">Alta intensidade, todos os dias</span>
        </button>
        <button class="btn preset-btn" @click="applyPreset('consistente')">
          Consistente
          <span class="preset-desc">Nível médio, dias úteis</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { generateGrid } from '../utils/dates.js'
import { useGraph } from '../composables/useGraph.js'

const props = defineProps({
  year: { type: Number, required: true }
})

const { setLevel, clearYear } = useGraph()

const minLevel = ref(1)
const maxLevel = ref(4)
const excludeDays = ref([0, 6]) // Exclude Sun and Sat by default
const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function fill() {
  const grid = generateGrid(props.year)
  for (let row = 0; row < grid.length; row++) {
    if (excludeDays.value.includes(row)) continue
    for (const cell of grid[row]) {
      if (!cell.date) continue
      const min = minLevel.value
      const max = maxLevel.value
      const level = Math.floor(Math.random() * (max - min + 1)) + min
      setLevel(cell.date, level)
    }
  }
}

function clear() {
  clearYear(props.year)
}

const PRESETS = {
  casual: {
    minLevel: 0,
    maxLevel: 2,
    excludeDays: [0, 6], // No weekends
    // 40% chance of contribution on any given day
    sparsity: 0.4
  },
  intenso: {
    minLevel: 2,
    maxLevel: 4,
    excludeDays: [],
    sparsity: 0.9
  },
  consistente: {
    minLevel: 1,
    maxLevel: 3,
    excludeDays: [0, 6],
    sparsity: 0.85
  }
}

function applyPreset(name) {
  const preset = PRESETS[name]
  clearYear(props.year)
  const grid = generateGrid(props.year)
  for (let row = 0; row < grid.length; row++) {
    if (preset.excludeDays.includes(row)) continue
    for (const cell of grid[row]) {
      if (!cell.date) continue
      if (Math.random() > preset.sparsity) continue
      const level = Math.floor(Math.random() * (preset.maxLevel - preset.minLevel + 1)) + preset.minLevel
      if (level > 0) {
        setLevel(cell.date, level)
      }
    }
  }
}
</script>

<style scoped>
.random-fill {
  border: 1px solid #21262d;
  border-radius: 8px;
  padding: 16px;
  background: #0d1117;
}

.random-fill h3 {
  font-size: 14px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0 0 12px;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 12px;
  color: #8b949e;
}

.field select {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 6px 10px;
  color: #c9d1d9;
  font-size: 13px;
}

.exclude-days {
  margin-bottom: 12px;
}

.exclude-days > label {
  font-size: 12px;
  color: #8b949e;
  display: block;
  margin-bottom: 6px;
}

.day-checks {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #c9d1d9;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  accent-color: #1f6feb;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid rgba(240, 246, 252, 0.1);
  transition: background 0.15s;
}

.fill-btn {
  background: #1f6feb;
  color: #fff;
}

.fill-btn:hover {
  background: #388bfd;
}

.clear-btn {
  background: transparent;
  border-color: #30363d;
  color: #c9d1d9;
}

.clear-btn:hover {
  background: #21262d;
}

.presets {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #21262d;
}

.presets > label {
  font-size: 12px;
  color: #8b949e;
  display: block;
  margin-bottom: 8px;
}

.preset-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 14px;
  background: #161b22;
  border-color: #30363d;
  color: #c9d1d9;
  min-width: 140px;
}

.preset-btn:hover {
  background: #21262d;
  border-color: #58a6ff;
}

.preset-desc {
  font-size: 10px;
  color: #484f58;
  font-weight: 400;
}
</style>
