<template>
  <header class="header glass" :class="{ scrolled: scrolled }">
    <div class="container">
      <nav class="nav">
        <router-link to="/" class="logo">
          📊 News Analysis
        </router-link>
        <router-link to="/stats" class="btn btn-secondary stats-link">
          📈 Общая статистика
        </router-link>
        
        <div class="auth-section">
          <template v-if="authStore.isAuthenticated">
            <router-link to="/create-report" class="btn btn-gradient" title="Создать новый отчет">
              <span class="btn-icon" aria-hidden="true">➕</span>
              <span>Создать отчет</span>
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
    <teleport to="body">
      <div v-if="showLoginModal" class="login-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" @click="closeLoginModal">
        <div class="login-modal" @click.stop>
          <button type="button" class="login-modal-close" aria-label="Закрыть" @click="closeLoginModal">×</button>
          <h2 id="login-modal-title">Вход в систему</h2>
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
    </teleport>
  </header>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { LoginCredentials } from '@/types'

const authStore = useAuthStore()
const scrolled = ref(false)
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

// Body scroll lock & ESC handling
function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && showLoginModal.value) {
    closeLoginModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKey)
  // restore just in case
  document.body.style.removeProperty('overflow')
})

watch(showLoginModal, (open: boolean) => {
  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.removeProperty('overflow')
  }
})

async function handleLogin() {
  if (!isFormValid.value) return
  
  const success = await authStore.login({ ...loginForm })
  if (success) {
    closeLoginModal()
  }
}

function handleScroll() {
  scrolled.value = window.scrollY > 8
}

window.addEventListener('scroll', handleScroll, { passive: true })
</script>

<script lang="ts">
export default {
  unmounted() {
    window.removeEventListener('scroll', (this as any).handleScroll)
  }
}
</script>

<style scoped>
.header {
  background: rgba(30,41,59,0.72);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  border-bottom: 1px solid var(--glass-border);
  padding: 0.85rem 0 .9rem;
  box-shadow: 0 4px 14px -4px rgba(0,0,0,0.55);
  position: sticky;
  top: 0;
  z-index: 50;
  transition: background .35s ease, box-shadow .35s ease, border-color .35s ease;
}
.header.scrolled {
  background: rgba(30,41,59,0.9);
  box-shadow: 0 6px 22px -6px rgba(0,0,0,0.65);
  border-color: rgba(255,255,255,0.12);
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  font-size: 1.35rem;
  font-weight: 700;
  text-decoration: none;
  color: var(--text-primary);
  letter-spacing: .5px;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
}
.logo:after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 0; height: 2px;
  background: linear-gradient(90deg,var(--accent),var(--success));
  transition: width .4s cubic-bezier(.4,.14,.3,1);
  border-radius: 2px;
}
.logo:hover:after { width: 100%; }

.auth-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Enhanced Create Report Button */
.create-report-btn {
  --cr-grad: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 45%, var(--success) 100%);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  padding: .8rem 1.15rem .8rem .95rem;
  border-radius: .9rem;
  font-weight: 600;
  font-size: .9rem;
  letter-spacing: .5px;
  text-decoration: none;
  background: var(--cr-grad);
  color: #fff;
  box-shadow: 0 6px 18px -6px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 5px rgba(59,130,246,0.15);
  isolation: isolate;
  transition: transform .3s cubic-bezier(.55,.1,.3,1), box-shadow .35s ease, filter .35s ease;
  overflow: hidden;
}
.create-report-btn:before, .create-report-btn:after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity .4s ease;
}
.create-report-btn:before { background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0)); mix-blend-mode: overlay; }
.create-report-btn:after { background: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.18), transparent 65%); mix-blend-mode: soft-light; }
.create-report-btn:hover { transform: translateY(-3px); filter: brightness(1.05) saturate(1.1); box-shadow: 0 12px 30px -8px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 6px rgba(59,130,246,0.25); }
.create-report-btn:hover:before, .create-report-btn:hover:after { opacity: 1; }
.create-report-btn:active { transform: translateY(1px) scale(.97); filter: brightness(.95); }
.create-report-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(255,255,255,0.85), 0 0 0 6px var(--accent); }
.create-report-btn .cr-icon { display:inline-flex; width:1.85rem; height:1.85rem; border-radius:.65rem; background:rgba(255,255,255,0.18); align-items:center; justify-content:center; font-size:1.1rem; font-weight:600; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25), 0 2px 4px -1px rgba(0,0,0,0.45); backdrop-filter: blur(4px) saturate(140%); }
.create-report-btn .cr-label { position:relative; top:1px; }

@media (max-width: 640px) {
  .create-report-btn { font-size:.78rem; padding:.7rem .95rem .7rem .8rem; border-radius:.8rem; }
  .create-report-btn .cr-icon { width:1.6rem; height:1.6rem; font-size:1rem; }
}

.stats-link {
  font-weight: 500;
}

.username {
  font-weight: 500;
  color: var(--text-secondary);
}

.login-modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.78); backdrop-filter:blur(10px) saturate(140%); -webkit-backdrop-filter:blur(10px) saturate(140%); z-index:1000; display:flex; align-items:center; justify-content:center; padding:clamp(1rem,2.5vh,2rem) .9rem; animation: fadeIn .25s ease; }
.login-modal { position:relative; background:linear-gradient(155deg,var(--bg-secondary) 0%, var(--bg-tertiary) 115%); border:1px solid var(--border); width:min(480px,100% - 2rem); max-height:calc(100vh - clamp(2.2rem,5vh,4rem)); border-radius:1rem; box-shadow:0 16px 38px -10px rgba(0,0,0,.65),0 3px 8px -2px rgba(0,0,0,.5); padding:2rem 2.1rem 2.15rem; overflow-y:auto; animation:modalIn .28s cubic-bezier(.4,.14,.3,1); }
.login-modal:before { content:''; position:absolute; inset:0; background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0)); pointer-events:none; }
.login-modal h2 { margin:0 0 1.15rem; color:var(--text-primary); text-align:center; font-size:1.35rem; letter-spacing:.5px; font-weight:600; }
.login-modal-close { position:absolute; top:.55rem; right:.6rem; width:2.1rem; height:2.1rem; border-radius:.65rem; border:1px solid var(--border); background:var(--bg-tertiary); color:var(--text-secondary); font-size:1.1rem; line-height:1; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:.2s background,.2s color,.25s box-shadow; }
.login-modal-close:hover { background:var(--accent); color:#fff; border-color:var(--accent); box-shadow:0 6px 14px -4px rgba(0,0,0,.55); }
.login-modal-close:focus-visible { outline:none; box-shadow:0 0 0 3px rgba(255,255,255,0.85),0 0 0 6px var(--accent); }
@keyframes modalIn { from { opacity:0; transform:translateY(14px) scale(.96);} to { opacity:1; transform:translateY(0) scale(1);} }

.error-text {
  color: var(--danger);
  font-size: 0.8rem;
  margin: 0.35rem 0 .25rem;
  text-align: center;
  font-weight: 500;
  letter-spacing: .3px;
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
  .login-modal { padding:1.65rem 1.4rem 1.7rem; max-height:calc(100vh - 2.2rem); }
}
</style>