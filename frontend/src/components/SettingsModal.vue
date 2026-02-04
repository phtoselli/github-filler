<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>Configurações</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label>Repositório (SSH URL)</label>
          <input
            v-model="form.repoUrl"
            type="text"
            placeholder="git@github.com:usuario/repo.git"
          />
        </div>
        <div class="field">
          <label>Chave SSH Privada</label>
          <textarea
            v-model="form.sshKey"
            rows="6"
            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
          />
        </div>
        <div class="field-row">
          <div class="field">
            <label>Nome (para commits)</label>
            <input v-model="form.userName" type="text" placeholder="Seu Nome" />
          </div>
          <div class="field">
            <label>Email (para commits)</label>
            <input v-model="form.userEmail" type="email" placeholder="seu@email.com" />
          </div>
        </div>
        <div class="field">
          <label>Ano de criação da conta GitHub</label>
          <input v-model.number="form.accountYear" type="number" min="2008" :max="currentYear" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="save-btn" @click="save">Salvar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'saved'])

const currentYear = new Date().getFullYear()

const form = reactive({
  repoUrl: '',
  sshKey: '',
  userName: '',
  userEmail: '',
  accountYear: 2020
})

onMounted(() => {
  const saved = localStorage.getItem('github-filler-settings')
  if (saved) {
    const parsed = JSON.parse(saved)
    Object.assign(form, parsed)
  }
})

function save() {
  localStorage.setItem('github-filler-settings', JSON.stringify({ ...form }))
  emit('saved', { ...form })
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  width: 520px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #21262d;
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #8b949e;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #c9d1d9;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.field label {
  font-size: 13px;
  color: #8b949e;
  font-weight: 500;
}

.field input,
.field textarea {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px 12px;
  color: #c9d1d9;
  font-size: 14px;
  font-family: 'Inter', monospace;
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px rgba(56, 139, 253, 0.15);
}

.field-row {
  display: flex;
  gap: 12px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #21262d;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  padding: 8px 20px;
  background: #238636;
  border: 1px solid rgba(240, 246, 252, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.save-btn:hover {
  background: #2ea043;
}
</style>
