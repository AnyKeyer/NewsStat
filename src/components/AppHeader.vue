<template>
  <header class="header">
    <div class="container">
      <nav class="nav">
        <router-link to="/" class="logo">
          📊 News Analysis
        </router-link>
        
        <div class="auth-section">
          <template v-if="authStore.isAuthenticated">
            <router-link to="/create-report" class="btn btn-success">
              ➕ Создать отчет
            </router-link>
            <span class="username">{{ authStore.username }}</span>
            <button @click="logout" class="btn btn-secondary">Выйти</button>
          </template>
          <template v-else>
            <button @click="openLoginModal" class="btn btn-primary">Войти</button>
          </template>
        </div>
      </nav>
    </div>
    
    <!-- Модальное окно входа -->
    <div v-if="showLoginModal" class="modal-overlay" @click="closeLoginModal">
      <div class="modal-content" @click.stop>
        <h2>Вход в систему</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="username" class="form-label">Логин</label>
            <input
              id="username"
              v-model="loginForm.username"
              type="text"
              class="form-input"
              placeholder="Введите логин"
              required
              ref="loginInput"
              :disabled="authStore.loading"
            />
          </div>
          <div class="form-group">
            <label for="password" class="form-label">Пароль</label>
            <input
              id="password"
              v-model="loginForm.password"
              type="password"
              class="form-input"
              placeholder="Введите пароль"
              required
              :disabled="authStore.loading"
            />
          </div>
          
          <div v-if="authStore.error" class="error-text">
            {{ authStore.error }}
          </div>
          
          <div class="modal-actions">
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="!isFormValid || authStore.loading"
            >
              {{ authStore.loading ? 'Вход...' : 'Войти' }}
            </button>
            <button type="button" @click="closeLoginModal" class="btn btn-secondary">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { LoginCredentials } from '@/types'

const authStore = useAuthStore()
const router = useRouter()

const showLoginModal = ref(false)
const loginInput = ref<HTMLInputElement>()

const loginForm = reactive<LoginCredentials>({
  username: '',
  password: ''
})

const isFormValid = computed(() => {
  return loginForm.username.trim() && loginForm.password.trim()
})

function logout() {
  authStore.logout()
  router.push('/')
}

async function openLoginModal() {
  showLoginModal.value = true
  authStore.clearError()
  await nextTick()
  loginInput.value?.focus()
}

function closeLoginModal() {
  showLoginModal.value = false
  loginForm.username = ''
  loginForm.password = ''
  authStore.clearError()
}

async function handleLogin() {
  if (!isFormValid.value) return
  
  const success = await authStore.login({ ...loginForm })
  if (success) {
    closeLoginModal()
  }
}
</script>

<style scoped>
.header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  box-shadow: 0 2px 4px var(--shadow);
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: var(--text-primary);
}

.auth-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-weight: 500;
  color: var(--text-secondary);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  text-align: center;
}

.error-text {
  color: var(--danger);
  font-size: 0.875rem;
  margin: 0.5rem 0;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}



@media (max-width: 768px) {
  .nav {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .auth-section {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>