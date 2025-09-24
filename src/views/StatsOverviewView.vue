<template>
  <div class="stats-overview">
    <div class="header-section">
      <h1>📈 Общая статистика по дням</h1>
      <p>Агрегированные показатели по всем загруженным отчетам</p>
      <div class="actions">
        <button @click="refresh" class="btn btn-secondary" :disabled="loadingAll">🔄 Обновить</button>
      </div>
    </div>

    <div v-if="loadingAll" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Загрузка и агрегация данных...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-message">
        <h3>❌ Ошибка</h3>
        <p>{{ error }}</p>
        <button @click="refresh" class="btn btn-primary">Попробовать снова</button>
      </div>
    </div>

    <div v-else>
      <div v-if="dailyAggregates.length === 0" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">🗓️</div>
          <h3>Данных пока нет</h3>
          <p>Создайте хотя бы один отчет, чтобы увидеть статистику.</p>
        </div>
      </div>

      <div v-else class="content">
        <!-- Глобальные показатели -->
        <div class="global-stats card glass fade-in">
          <h2>Сводка</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="label">Всего отчетов</span>
              <span class="value">{{ totalReports }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Всего новостей</span>
              <span class="value">{{ totalNews }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Позитивных</span>
              <span class="value success">{{ totalPositive }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Негативных</span>
              <span class="value danger">{{ totalNegative }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Средний рост</span>
              <span class="value success">{{ overallAvgGrowth.toFixed(2) }}%</span>
            </div>
            <div class="stat-item">
              <span class="label">Среднее падение</span>
              <span class="value danger">{{ overallAvgDecline.toFixed(2) }}%</span>
            </div>
          </div>
        </div>

        <!-- Таблица по дням -->
        <div class="daily-table card glass fade-in">
          <h2>По дням</h2>
          <div class="table-wrapper">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Отчетов</th>
                  <th>Новостей</th>
                  <th>Позитивных</th>
                  <th>Негативных</th>
                  <th>Средн. рост</th>
                  <th>Средн. падение</th>
                  <th>% +</th>
                  <th>% -</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="day in dailyAggregates" :key="day.dateKey">
                  <td class="date">{{ day.displayDate }}</td>
                  <td>{{ day.totalReports }}</td>
                  <td>{{ day.totalNews }}</td>
                  <td class="success">{{ day.positiveNews }}</td>
                  <td class="danger">{{ day.negativeNews }}</td>
                  <td class="success">{{ day.avgGrowth.toFixed(2) }}%</td>
                  <td class="danger">{{ day.avgDecline.toFixed(2) }}%</td>
                  <td>{{ day.positivePercent.toFixed(1) }}%</td>
                  <td>{{ day.negativePercent.toFixed(1) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReportStore } from '@/stores/reports'
import r2Service from '@/services/r2Service'
import metaService from '@/services/metaService'

interface DailyAggregate {
  dateKey: string
  displayDate: string
  totalReports: number
  totalNews: number
  positiveNews: number
  negativeNews: number
  avgGrowth: number
  avgDecline: number
  positivePercent: number
  negativePercent: number
}

const reportStore = useReportStore()
const loadingAll = ref(false)
const error = ref<string | null>(null)
const fullReportsCache = ref<Map<string, any>>(new Map())
const dailyAggregates = ref<DailyAggregate[]>([])

const totalReports = computed(() => reportStore.reports.length)
const totalNews = computed(() => dailyAggregates.value.reduce((sum, d) => sum + d.totalNews, 0))
const totalPositive = computed(() => dailyAggregates.value.reduce((sum, d) => sum + d.positiveNews, 0))
const totalNegative = computed(() => dailyAggregates.value.reduce((sum, d) => sum + d.negativeNews, 0))
const overallAvgGrowth = computed(() => {
  let growthValues: number[] = []
  for (const report of fullReportsCache.value.values()) {
    for (const n of report.news) if (n.impact > 0) growthValues.push(n.impact)
  }
  if (growthValues.length === 0) return 0
  return growthValues.reduce((a,b) => a + b, 0) / growthValues.length
})
const overallAvgDecline = computed(() => {
  let declineValues: number[] = []
  for (const report of fullReportsCache.value.values()) {
    for (const n of report.news) if (n.impact < 0) declineValues.push(Math.abs(n.impact))
  }
  if (declineValues.length === 0) return 0
  return declineValues.reduce((a,b) => a + b, 0) / declineValues.length
})

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
  if (dateKey === todayKey) return 'Сегодня'
  if (dateKey === yesterdayKey) return 'Вчера'
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

async function loadAll() {
  loadingAll.value = true
  error.value = null
  dailyAggregates.value = []
  try {
    // Сначала список отчетов
    await reportStore.loadReports()

    // Загружаем полный контент отчетов (параллельно, но ограниченно)
    const concurrency = 4
    const queue = [...reportStore.reports]
    const workers: Promise<void>[] = []

    async function worker() {
      while (queue.length) {
        const next = queue.shift()
        if (!next) break
        if (fullReportsCache.value.has(next.id)) continue
        try {
          const full = await r2Service.getReport(next.id)
          if (full) fullReportsCache.value.set(next.id, full)
        } catch (e) {
          console.warn('Не удалось загрузить отчет', next.id, e)
        }
      }
    }

    for (let i=0;i<concurrency;i++) workers.push(worker())
    await Promise.all(workers)

    // Агрегация
    const dayMap = new Map<string, DailyAggregate>()
    for (const report of fullReportsCache.value.values()) {
      const dateKey = formatDateKey(report.createdAt)
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          dateKey,
            displayDate: formatDisplayDate(report.createdAt),
            totalReports: 0,
            totalNews: 0,
            positiveNews: 0,
            negativeNews: 0,
            avgGrowth: 0,
            avgDecline: 0,
            positivePercent: 0,
            negativePercent: 0
        })
      }
      const agg = dayMap.get(dateKey)!
      agg.totalReports += 1
      agg.totalNews += report.news.length
      for (const n of report.news) {
        if (n.impact > 0) agg.positiveNews += 1
        else if (n.impact < 0) agg.negativeNews += 1
      }
    }

    // Рассчитать средние
    for (const [dateKey, agg] of dayMap.entries()) {
      // собираем значения за день
      const growthValues: number[] = []
      const declineValues: number[] = []
      for (const report of fullReportsCache.value.values()) {
        const rk = formatDateKey(report.createdAt)
        if (rk !== dateKey) continue
        for (const n of report.news) {
          if (n.impact > 0) growthValues.push(n.impact)
          else if (n.impact < 0) declineValues.push(Math.abs(n.impact))
        }
      }
      agg.avgGrowth = growthValues.length ? growthValues.reduce((a,b)=>a+b,0)/growthValues.length : 0
      agg.avgDecline = declineValues.length ? declineValues.reduce((a,b)=>a+b,0)/declineValues.length : 0
      agg.positivePercent = agg.totalNews ? (agg.positiveNews / agg.totalNews) * 100 : 0
      agg.negativePercent = agg.totalNews ? (agg.negativeNews / agg.totalNews) * 100 : 0
    }

    dailyAggregates.value = Array.from(dayMap.values()).sort((a,b)=> b.dateKey.localeCompare(a.dateKey))

    // Мета-теги
    metaService.updatePageMeta({
      title: 'Общая статистика | News Analysis',
      description: 'Агрегированная статистика по всем отчетам анализа новостей',
      url: window.location.href
    })
  } catch (e:any) {
    error.value = 'Не удалось загрузить данные'
    console.error(e)
  } finally {
    loadingAll.value = false
  }
}

async function refresh() { await loadAll() }

onMounted(() => {
  loadAll()
})
</script>

<style scoped>
.header-section { text-align:center; margin-bottom:2rem; }
.header-section h1 { font-size:2rem; margin-bottom:.5rem; color:var(--text-primary); }
.header-section p { color:var(--text-secondary); }
.actions { margin-top:1rem; }

.loading-state, .error-state { text-align:center; padding:4rem 0; }
.loading-spinner { width:48px; height:48px; border:4px solid var(--bg-tertiary); border-top:4px solid var(--accent); border-radius:50%; animation: spin 1s linear infinite; margin:0 auto 1rem; }
@keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }

.global-stats { margin-bottom:2rem; }
.stats-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap:1rem; margin-top:1rem; }
.stat-item { background:var(--bg-tertiary); padding:.85rem .9rem; border:1px solid var(--border); border-radius:.65rem; display:flex; flex-direction:column; gap:.4rem; }
.stat-item .label { font-size:.75rem; letter-spacing:.5px; text-transform:uppercase; color:var(--text-secondary); font-weight:600; }
.stat-item .value { font-size:1.1rem; font-weight:600; letter-spacing:.3px; }
.stat-item .value.success { color: var(--success); }
.stat-item .value.danger { color: var(--danger); }

.daily-table h2 { margin-bottom:1rem; }
.table-wrapper { overflow-x:auto; }
.stats-table { width:100%; border-collapse: collapse; }
.stats-table th, .stats-table td { padding:.6rem .75rem; text-align:right; font-variant-numeric: tabular-nums; }
.stats-table th { background:var(--bg-tertiary); position:sticky; top:0; font-size:.7rem; letter-spacing:.5px; text-transform:uppercase; color:var(--text-secondary); font-weight:600; }
.stats-table td.date, .stats-table th:first-child { text-align:left; }
.stats-table tbody tr { border-bottom:1px solid var(--border); }
.stats-table tbody tr:hover { background:rgba(255,255,255,0.04); }
.success { color: var(--success); }
.danger { color: var(--danger); }

.empty-state { display:flex; justify-content:center; align-items:center; min-height:400px; }
.empty-content { text-align:center; max-width:400px; }
.empty-icon { font-size:4rem; margin-bottom:1rem; }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); }
  .stats-table th, .stats-table td { padding:.45rem .55rem; }
}
</style>
