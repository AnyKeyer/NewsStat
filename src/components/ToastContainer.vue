<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast-fade" tag="div">
      <div
        v-for="t in toasts.items"
        :key="t.id"
        class="toast"
        :class="t.type"
        role="alert"
        @mouseenter="pause(t.id)"
        @mouseleave="resume(t.id)"
      >
        <div class="toast-icon" aria-hidden="true">
          <span v-if="t.type==='success'">✅</span>
          <span v-else-if="t.type==='error'">❌</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-message">{{ t.message }}</div>
        <button class="toast-close" @click="toasts.remove(t.id)" aria-label="Закрыть">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toasts'
import { onUnmounted } from 'vue'

const toasts = useToastStore()

// Simple pause/resume mechanism (extendable)
const timers = new Map<string, number>()

function pause(id: string) {
  const el = toasts.items.find(t => t.id === id)
  if (!el) return
  // Not storing remaining time now (simple version)
}
function resume(id: string) {
  // placeholder for advanced behavior
}

onUnmounted(() => timers.forEach(id => clearTimeout(id)))
</script>

<style scoped>
.toast-stack { position:fixed; top:1.1rem; right:1rem; display:flex; flex-direction:column; gap:.65rem; width: min(360px, 90vw); z-index:2000; }
.toast { display:flex; align-items:flex-start; gap:.65rem; background:linear-gradient(145deg,var(--bg-secondary) 0%, var(--bg-tertiary) 115%); border:1px solid var(--border); padding:.85rem .95rem .9rem; border-radius:.85rem; box-shadow:0 6px 18px -6px rgba(0,0,0,.55), 0 2px 6px -2px rgba(0,0,0,0.45); position:relative; overflow:hidden; font-size:.82rem; line-height:1.35; }
.toast:before { content:''; position:absolute; inset:0; background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0)); pointer-events:none; }
.toast.success { border-color: rgba(16,185,129,0.5); }
.toast.success .toast-icon { color: var(--success); }
.toast.error { border-color: rgba(239,68,68,0.55); }
.toast.error .toast-icon { color: var(--danger); }
.toast.info { border-color: rgba(59,130,246,0.5); }
.toast.info .toast-icon { color: var(--accent); }
.toast-icon { font-size:1rem; line-height:1; position:relative; top:2px; }
.toast-message { flex:1; color:var(--text-secondary); font-weight:500; }
.toast-close { appearance:none; border:none; background:var(--bg-tertiary); color:var(--text-muted); width:1.65rem; height:1.65rem; border-radius:.5rem; cursor:pointer; font-size:1rem; line-height:1; display:flex; align-items:center; justify-content:center; padding:0; position:relative; top:1px; }
.toast-close:hover { background:var(--accent); color:#fff; }
.toast-fade-enter-active, .toast-fade-leave-active { transition: .3s cubic-bezier(.45,.05,.35,1); }
.toast-fade-enter-from { opacity:0; transform:translateY(10px) scale(.95); }
.toast-fade-leave-to { opacity:0; transform:translateY(6px) scale(.95); }
@media (max-width:640px){ .toast-stack { right:50%; transform:translateX(50%); top:.85rem; } }
</style>
