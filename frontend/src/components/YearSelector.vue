<template>
  <div class="year-selector">
    <button
      v-for="year in years"
      :key="year"
      class="year-btn"
      :class="{ active: year === modelValue }"
      @click="$emit('update:modelValue', year)"
    >
      {{ year }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  startYear: { type: Number, default: 2020 }
})

defineEmits(['update:modelValue'])

const currentYear = new Date().getFullYear()

const years = computed(() => {
  const list = []
  for (let y = props.startYear; y <= currentYear; y++) {
    list.push(y)
  }
  return list
})
</script>

<style scoped>
.year-selector {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.year-btn {
  padding: 6px 14px;
  border: 1px solid #30363d;
  border-radius: 6px;
  background: transparent;
  color: #c9d1d9;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.year-btn:hover {
  border-color: #58a6ff;
  color: #58a6ff;
}

.year-btn.active {
  background: #1f6feb;
  border-color: #1f6feb;
  color: #fff;
}
</style>
