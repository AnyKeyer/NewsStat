import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  timeout?: number
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

export const useToastStore = defineStore('toasts', () => {
  const items = ref<Toast[]>([])

  function push(message: string, type: Toast['type']='info', timeout=4000) {
    const id = genId()
    const toast: Toast = { id, type, message, timeout }
    items.value.push(toast)
    if (timeout > 0) {
      setTimeout(() => remove(id), timeout)
    }
    return id
  }
  function success(message: string, timeout=3500) { return push(message, 'success', timeout) }
  function error(message: string, timeout=6000) { return push(message, 'error', timeout) }
  function info(message: string, timeout=4000) { return push(message, 'info', timeout) }

  function remove(id: string) {
    items.value = items.value.filter(t => t.id !== id)
  }
  function clear() { items.value = [] }

  return { items, push, success, error, info, remove, clear }
})
