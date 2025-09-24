<template>
  <div class="home">
    <div class="header-section">
      <h1>📊 Отчеты анализа новостей</h1>
      <p>Анализ влияния новостей на криптовалютные токены</p>
      <button @click="loadReports" class="btn btn-secondary" style="margin-top: 1rem;">
        🔄 Обновить список
      </button>
      <div v-if="reportStore.reports.length" class="pagination-controls top">
        <div class="page-size">
          <label>
            На странице:
            <select v-model.number="pageSize">
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
        </div>
        <div class="pager" v-if="totalPages > 1">
          <button class="btn btn-secondary" :disabled="currentPage === 1" @click="goToPage(1)">«</button>
          <button class="btn btn-secondary" :disabled="currentPage === 1" @click="prevPage">‹</button>
          <span class="page-info">Стр. {{ currentPage }} / {{ totalPages }}</span>
          <button class="btn btn-secondary" :disabled="currentPage === totalPages" @click="nextPage">›</button>
          <button class="btn btn-secondary" :disabled="currentPage === totalPages" @click="goToPage(totalPages)">»</button>
        </div>
      </div>
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
            class="report-card card card-hover fade-in"
            @click="navigateToReport(report.id)"
          >
            <div class="report-content">
              <div class="report-header">
                <div class="report-title-block">
                  <h3>{{ report.title }}</h3>
                  <span class="report-time">{{ formatTime(report.createdAt) }}</span>
                </div>
                <div class="mini-stats" v-if="statsMap[report.id]">
                  <span class="badge accent" v-if="statsMap[report.id].totalNews">{{ statsMap[report.id].totalNews }} шт</span>
                  <span class="badge success" v-if="statsMap[report.id].averageGrowth && statsMap[report.id].averageGrowth > 0">+{{ statsMap[report.id].averageGrowth.toFixed(1) }}%</span>
                  <span class="badge danger" v-if="statsMap[report.id].averageDecline && statsMap[report.id].averageDecline > 0">-{{ statsMap[report.id].averageDecline.toFixed(1) }}%</span>
                </div>
              </div>
              <div class="report-progress" v-if="statsMap[report.id]">
                <div class="progress-bar mini">
                  <div class="seg pos" :style="{ width: positivePercent(report.id) + '%' }"></div>
                  <div class="seg neg" :style="{ width: negativePercent(report.id) + '%' }"></div>
                </div>
              </div>
            </div>
            <div class="report-actions" v-if="canDeleteReports">
              <button 
                @click.stop="deleteReport(report.id)"
                class="btn-delete"
                title="Удалить отчет"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="pagination-controls bottom" v-if="totalPages > 1">
        <div class="pager">
          <button class="btn btn-secondary" :disabled="currentPage === 1" @click="goToPage(1)">« Первая</button>
          <button class="btn btn-secondary" :disabled="currentPage === 1" @click="prevPage">‹ Назад</button>
          <span class="page-info">Страница {{ currentPage }} из {{ totalPages }}</span>
            <button class="btn btn-secondary" :disabled="currentPage === totalPages" @click="nextPage">Вперёд ›</button>
          <button class="btn btn-secondary" :disabled="currentPage === totalPages" @click="goToPage(totalPages)">Последняя »</button>
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
import { onMounted, onActivated, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reports'
import { useAuthStore } from '@/stores/auth'
import metaService from '@/services/metaService'
import type { ReportStatistics } from '@/types'

interface DateGroup {
  date: string
  displayDate: string
  reports: Array<{ id: string; title: string; createdAt: Date }>
}

const router = useRouter()
const reportStore = useReportStore()
const authStore = useAuthStore()

// Кэш статистики отчетов (загружаем по требованию)
const reportStatsCache = ref<Map<string, ReportStatistics>>(new Map())

// Удобное отображение кэша для шаблона
const statsMap = computed(() => Object.fromEntries(reportStatsCache.value.entries()))

// Проверяем права пользователя
const canDeleteReports = computed(() => {
  return authStore.user?.role === 'admin'
})

// Пагинация
const pageSize = ref(20)
const currentPage = ref(1)

const sortedReports = computed(() => {
  return [...reportStore.reports].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(sortedReports.value.length / pageSize.value))
})

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedReports.value.slice(start, start + pageSize.value)
})

watch([pageSize, () => reportStore.reports.length], () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  if (currentPage.value < 1) currentPage.value = 1
})

function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function goToPage(p: number) { const t = Math.min(Math.max(1, p), totalPages.value); currentPage.value = t }

const reportsByDate = computed(() => {
  const groups: DateGroup[] = []
  const groupMap = new Map<string, Array<{ id: string; title: string; createdAt: Date }>>()
  for (const report of paginatedReports.value) {
    const dateKey = formatDateKey(report.createdAt)
    if (!groupMap.has(dateKey)) groupMap.set(dateKey, [])
    groupMap.get(dateKey)!.push(report)
  }
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

function getReportStats(reportId: string): ReportStatistics | null {
  return reportStatsCache.value.get(reportId) || null
}

function positivePercent(reportId: string): number {
  const stats = getReportStats(reportId)
  if (!stats || stats.totalNews === 0) return 0
  return (stats.positiveNewsCount / stats.totalNews) * 100
}
function negativePercent(reportId: string): number {
  const stats = getReportStats(reportId)
  if (!stats || stats.totalNews === 0) return 0
  return (stats.negativeNewsCount / stats.totalNews) * 100
}

async function loadReportStats(reportId: string) {
  if (reportStatsCache.value.has(reportId)) return
  
  try {
    // Загружаем полный отчет для получения статистики
    await reportStore.loadReport(reportId)
    const report = reportStore.currentReport
    
    if (report && report.news) {
      const positiveNews = report.news.filter(n => n.impact > 0)
      const negativeNews = report.news.filter(n => n.impact < 0)
      
      const stats: ReportStatistics = {
        totalNews: report.news.length,
        workingNews: report.news.length,
        averageGrowth: positiveNews.length > 0 
          ? positiveNews.reduce((sum, n) => sum + n.impact, 0) / positiveNews.length 
          : 0,
        averageDecline: negativeNews.length > 0
          ? negativeNews.reduce((sum, n) => sum + n.impact, 0) / negativeNews.length
          : 0,
        positiveNewsCount: positiveNews.length,
        negativeNewsCount: negativeNews.length
      }
      
      reportStatsCache.value.set(reportId, stats)
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики отчета:', error)
  }
}

async function loadReports() {
  await reportStore.loadReports()
  
  // Загружаем статистику для всех отчетов
  for (const report of reportStore.reports) {
    loadReportStats(report.id)
  }
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

.report-card { display:flex; justify-content:space-between; align-items:stretch; gap:1rem; cursor:pointer; }

.report-content {
  flex: 1;
}

.report-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:.65rem; }
.report-header h3 { color:var(--text-primary); margin:0 0 .25rem; font-size:1.05rem; font-weight:600; letter-spacing:.3px; }
.report-title-block { display:flex; flex-direction:column; }
.mini-stats { display:flex; gap:.35rem; flex-wrap:wrap; }
.report-progress { margin-top:.25rem; }
.progress-bar.mini { height:6px; background:var(--bg-tertiary); border-radius:4px; display:flex; overflow:hidden; border:1px solid var(--border); }
.progress-bar.mini .seg { height:100%; transition:width .6s ease; }
.progress-bar.mini .seg.pos { background: linear-gradient(90deg, rgba(16,185,129,0.9), rgba(16,185,129,0.45)); }
.progress-bar.mini .seg.neg { background: linear-gradient(90deg, rgba(239,68,68,0.85), rgba(239,68,68,0.45)); }

.report-time {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.report-stats, .stat-item, .stat-label, .stat-value { display:none; }

.report-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
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

.pagination-controls { display:flex; align-items:center; justify-content:center; gap:1.25rem; flex-wrap:wrap; margin-top:1.25rem; }
.pagination-controls.top { margin-top:1.5rem; }
.pagination-controls .pager { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
.pagination-controls .page-info { font-size:.85rem; letter-spacing:.5px; color:var(--text-secondary); font-weight:500; }
.pagination-controls select { background: var(--bg-tertiary); border:1px solid var(--border); color:var(--text-primary); padding:.35rem .55rem; border-radius:.45rem; font-size:.85rem; }
.pagination-controls button.btn { padding:.45rem .7rem; font-size:.8rem; }


@media (max-width: 768px) {
  .header-section h1 {
    font-size: 1.75rem;
  }
  
  .report-card {
    padding: 1rem;
  }
}
</style>