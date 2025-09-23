import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/report/:id',
    name: 'ReportDetail',
    component: () => import('@/views/ReportDetailView.vue'),
    props: true
  },
  {
    path: '/create-report',
    name: 'CreateReport',
    component: () => import('@/views/CreateReportView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Защита маршрутов
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Если пользователь не авторизован, перенаправляем на главную
    // Модальное окно входа откроется автоматически при попытке создать отчет
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router