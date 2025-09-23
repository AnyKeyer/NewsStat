import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials } from '@/types'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(authService.getCurrentUser())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => {
    return user.value?.isAuthenticated ?? false
  })

  const username = computed(() => {
    return user.value?.displayName ?? user.value?.username ?? ''
  })

  async function login(credentials: LoginCredentials): Promise<boolean> {
    loading.value = true
    error.value = null
    
    try {
      const authenticatedUser = await authService.login(credentials)
      
      if (authenticatedUser) {
        user.value = authenticatedUser
        return true
      } else {
        error.value = 'Неверный логин или пароль'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка входа'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    authService.logout()
    user.value = null
    error.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    username,
    login,
    logout,
    clearError
  }
})