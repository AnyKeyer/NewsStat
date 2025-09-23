import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
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
  },
  // Catch-all (optional inside SPA). Real 404 handled by public/404.html for deep links on GitHub Pages.
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory('/NewsStat/'),
  routes,
  scrollBehavior(to: RouteLocationNormalized, from: RouteLocationNormalized, saved: { left: number; top: number } | null) {
    if (saved) return saved
    return { top: 0 }
  }
})

// Auth guard
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router