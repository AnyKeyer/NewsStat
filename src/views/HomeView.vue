<template>
  <div class="home">
    <div class="header-section">
      <h1>📊 Отчеты анализа новостей</h1>
      <p>Анализ влияния новостей на криптовалютные токены</p>
      <button @click="loadReports" class="btn btn-secondary" style="margin-top: 1rem;">
        🔄 Обновить список
      </button>
    </div>

    <!-- Состояние загрузки -->
    <div v-if="reportStore.loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Загрузка отчетов...</p>
    </div>

    <!-- Ошибка -->
    <div v-else-if="reportStore.error" class="error-state">
      <div class="error-message">
        <h3>❌ Ошибка загрузки</h3>
        <p>{{ reportStore.error }}</p>
        <button @click="loadReports" class="btn btn-primary">Попробовать снова</button>
      </div>
    </div>

    <!-- Отчеты по дням -->
    <div v-else-if="reportsByDate.length > 0" class="reports-by-date">
      <div 
        v-for="dateGroup in reportsByDate" 
        :key="dateGroup.date" 
        class="date-group"
      >
        <h2 class="date-header">{{ dateGroup.displayDate }}</h2>
        <div class="reports-list">
          <div 
            v-for="report in dateGroup.reports" 
            :key="report.id" 
            class="report-card"
          >
            <div class="report-content" @click="navigateToReport(report.id)">
              <h3>{{ report.title }}</h3>
              <span class="report-time">{{ formatTime(report.createdAt) }}</span>
            </div>
            <div class="report-actions">
              <button 
                v-if="canDeleteReports" 
                @click.stop="deleteReport(report.id)"
                class="btn-delete"
                title="Удалить отчет"
              >
                🗑️
              </button>
              <div class="report-arrow" @click="navigateToReport(report.id)">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">📝</div>
        <h3>Отчетов пока нет</h3>
        <p>Станьте первым, кто создаст отчет анализа новостей!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reports'
import { useAuthStore } from '@/stores/auth'
import metaService from '@/services/metaService'

interface DateGroup {
  date: string
  displayDate: string
  reports: Array<{ id: string; title: string; createdAt: Date }>
}

const router = useRouter()
const reportStore = useReportStore()
const authStore = useAuthStore()

// Проверяем права пользователя
const canDeleteReports = computed(() => {
  return authStore.user?.role === 'admin'
})

const reportsByDate = computed(() => {
  const groups: DateGroup[] = []
  const groupMap = new Map<string, Array<{ id: string; title: string; createdAt: Date }>>()

  // Группируем отчеты по дням
  for (const report of reportStore.reports) {
    const dateKey = formatDateKey(report.createdAt)
    if (!groupMap.has(dateKey)) {
      groupMap.set(dateKey, [])
    }
    groupMap.get(dateKey)!.push(report)
  }

  // Преобразуем в массив с сортировкой
  for (const [dateKey, reports] of groupMap.entries()) {
    groups.push({
      date: dateKey,
      displayDate: formatDisplayDate(reports[0].createdAt),
      reports: reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    })
  }

  return groups.sort((a, b) => b.date.localeCompare(a.date))
})

function navigateToReport(reportId: string) {
  router.push({ name: 'ReportDetail', params: { id: reportId } })
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dateKey = formatDateKey(date)
  const todayKey = formatDateKey(today)
  const yesterdayKey = formatDateKey(yesterday)
  
  if (dateKey === todayKey) {
    return 'Сегодня'
  } else if (dateKey === yesterdayKey) {
    return 'Вчера'
  } else {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

async function loadReports() {
  await reportStore.loadReports()
}

async function deleteReport(reportId: string) {
  if (!confirm('Вы уверены, что хотите удалить этот отчет? Действие нельзя отменить.')) {
    return
  }
  
  try {
    await reportStore.deleteReport(reportId)
  } catch (error) {
    alert('Ошибка при удалении отчета. Попробуйте еще раз.')
  }
}

onMounted(() => {
  loadReports()
  // Устанавливаем дефолтные мета-теги для главной страницы
  metaService.resetToDefault()
})

onActivated(() => {
  // Обновляем список отчетов при возврате на страницу
  loadReports()
  // Сбрасываем мета-теги на дефолтные
  metaService.resetToDefault()
})
</script>

<style scoped>
.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.header-section p {
  color: var(--text-secondary);
  font-size: 1.125rem;
}

.loading-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--bg-tertiary);
  border-top: 4px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.error-message {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
  background: var(--bg-secondary);
  border: 1px solid var(--danger);
  border-radius: 0.5rem;
}

.error-message h3 {
  color: var(--danger);
  margin-bottom: 1rem;
}

.date-group {
  margin-bottom: 2rem;
}

.date-header {
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border);
  font-size: 1.25rem;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.report-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px var(--shadow);
}

.report-content h3 {
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.report-time {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.report-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-delete {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.btn-delete:hover {
  opacity: 1;
  background: var(--danger);
  color: white;
}

.report-arrow {
  color: var(--accent);
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.2s ease;
}

.report-arrow:hover {
  color: var(--primary);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-content h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.empty-content p {
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .header-section h1 {
    font-size: 1.75rem;
  }
  
  .report-card {
    padding: 1rem;
  }
}
</style>