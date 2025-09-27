<template>
  <div class="home">
    <div class="header-section">
      <h1>📊 Отчеты анализа новостей</h1>
      <p>Анализ влияния новостей на криптовалютные токены</p>
      <div class="quick-check">
        <input v-model="quickUrl" type="url" class="qc-input" placeholder="Быстрая проверка: вставьте ссылку на новость" @input="debouncedQuickCheck" />
        <div class="qc-status" v-if="qc.state !== 'idle'" :class="qc.state">
          <template v-if="qc.state==='empty'">Введите ссылку</template>
          <template v-else-if="qc.state==='checking'">⏳ Проверяем...</template>
          <template v-else-if="qc.state==='unique'">✅ Уникальна</template>
          <template v-else-if="qc.state==='duplicate'">
            ⚠️ {{ qc.matches.length }} совп.
            <div class="qc-pop">
              <strong>Найдено ранее:</strong>
              <ul>
                <li v-for="m in qc.matches" :key="m.newsId" @click.stop="goReport(m.reportId)">
                  <span class="t">{{ m.newsTitle || 'Без заголовка' }}</span>
                  <span class="r">в отчете «{{ m.reportTitle || m.reportId }}»</span>
                  <span class="d">{{ new Date(m.date).toLocaleString() }}</span>
                </li>
              </ul>
            </div>
          </template>
          <template v-else-if="qc.state==='error'">Ошибка</template>
        </div>
      </div>
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
            class="report-card enhanced fade-in"
            @click="navigateToReport(report.id)"
            :data-empty="!statsMap[report.id] || statsMap[report.id].totalNews === 0"
          >
            <div class="rc-body">
              <div class="rc-top">
                <div class="rc-title-block">
                  <h3 class="rc-title">{{ report.title }}</h3>
                  <span class="rc-time" :title="report.createdAt.toLocaleString()">{{ formatTime(report.createdAt) }}</span>
                </div>
                <div v-if="statsMap[report.id] && statsMap[report.id].totalNews" class="rc-delta" :title="'Доля новостей со сдвигом цены'">
                  Δ {{ statsMap[report.id].movedPercent.toFixed(0) }}%
                </div>
              </div>

              <div v-if="cardStats(report.id)" class="rc-kpis">
                <div class="kpi total" :title="'Всего новостей'">
                  <div class="kv">{{ cardStats(report.id)!.total }}</div>
                  <div class="kl">всего</div>
                </div>
                <div class="kpi moved" :class="{faded: !cardStats(report.id)!.moved}" :title="'Сдвиг (кол-во / % от всех)'">
                  <div class="kv">{{ cardStats(report.id)!.moved }}</div>
                  <div class="ksub" v-if="cardStats(report.id)!.moved">{{ cardStats(report.id)!.movedPercent }}%</div>
                  <div class="kl">Δ</div>
                </div>
                <div class="kpi static" :class="{faded: !cardStats(report.id)!.static}" :title="'Без сдвига'">
                  <div class="kv">{{ cardStats(report.id)!.static }}</div>
                  <div class="kl">без</div>
                </div>
                <div class="kpi unmarked" v-if="cardStats(report.id)!.unmarked" :title="'Не отмечено движений'">
                  <div class="kv">{{ cardStats(report.id)!.unmarked }}</div>
                  <div class="kl">?</div>
                </div>
                <div class="kpi growth" v-if="cardStats(report.id)!.avgGrowth" :title="'Средний % роста по позитивным'">
                  <div class="kv plus">+{{ cardStats(report.id)!.avgGrowth }}</div>
                  <div class="kl">рост</div>
                </div>
                <div class="kpi decline" v-if="cardStats(report.id)!.avgDecline" :title="'Средний % падения по негативным'">
                  <div class="kv minus">-{{ cardStats(report.id)!.avgDecline }}</div>
                  <div class="kl">падение</div>
                </div>
              </div>

              <div v-if="cardStats(report.id) && cardStats(report.id)!.total" class="rc-progress" aria-hidden="true">
                <div class="bar">
                  <div class="seg moved" :style="{ width: cardStats(report.id)!.movedBar + '%' }"></div>
                  <div class="seg static" :style="{ width: cardStats(report.id)!.staticBar + '%' }"></div>
                  <div class="seg unmarked" v-if="cardStats(report.id)!.unmarkedBar > 0" :style="{ width: cardStats(report.id)!.unmarkedBar + '%' }"></div>
                </div>
              </div>

              <!-- Hover overlay removed per request -->
            </div>
            <div class="rc-actions" v-if="canDeleteReports">
              <button
                @click.stop="deleteReport(report.id)"
                class="btn btn-danger-outline btn-sm btn-icon-only"
                title="Удалить отчет"
              >🗑️</button>
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
import r2Service from '@/services/r2Service'
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

interface CardStats {
  total: number
  moved: number
  static: number
  unmarked: number
  movedPercent: number
  staticPercent: number
  unmarkedPercent: number
  avgGrowth: string | null
  avgDecline: string | null
  movedBar: number
  staticBar: number
  unmarkedBar: number
}

function cardStats(id: string): CardStats | null {
  const s = getReportStats(id)
  if (!s) return null
  const total = s.totalNews || 0
  if (!total) return { total:0, moved:0, static:0, unmarked:0, movedPercent:0, staticPercent:0, unmarkedPercent:0, avgGrowth:null, avgDecline:null, movedBar:0, staticBar:0, unmarkedBar:0 }
  const movedPercent = Math.round(s.movedPercent)
  const staticPercent = Math.round((s.staticCount / total) * 100)
  const unmarkedPercent = Math.round((s.unmarkedCount / total) * 100)
  const movedBar = s.movedPercent
  const staticBar = (s.staticCount / total) * 100
  const unmarkedBar = (s.unmarkedCount / total) * 100
  const avgGrowth = s.positiveNewsCount ? (s.averageGrowth).toFixed(1) : null
  const avgDecline = s.negativeNewsCount ? Math.abs(s.averageDecline).toFixed(1) : null
  return {
    total: total,
    moved: s.movedCount,
    static: s.staticCount,
    unmarked: s.unmarkedCount,
    movedPercent,
    staticPercent,
    unmarkedPercent,
    avgGrowth,
    avgDecline,
    movedBar: Number(movedBar.toFixed(2)),
    staticBar: Number(staticBar.toFixed(2)),
    unmarkedBar: Number(unmarkedBar.toFixed(2)),
  }
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
      // Movement classification
      let movedCount = 0
      let staticCount = 0
      let unmarkedCount = 0
      for (const n of report.news) {
        if (n.priceMoved === true) movedCount++
        else if (n.priceMoved === false) staticCount++
        else unmarkedCount++
      }
      
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
        negativeNewsCount: negativeNews.length,
        movedCount,
        staticCount,
        unmarkedCount,
        movedPercent: report.news.length === 0 ? 0 : (movedCount / report.news.length) * 100
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

// ===== Быстрая проверка новости по URL =====
const quickUrl = ref('')
interface QCState { state: 'idle' | 'empty' | 'checking' | 'unique' | 'duplicate' | 'error'; matches: any[] }
const qc = ref<QCState>({ state: 'idle', matches: [] })
let qcTimer: any = null
function debouncedQuickCheck() {
  if (qcTimer) clearTimeout(qcTimer)
  const v = quickUrl.value.trim()
  if (!v) { qc.value = { state: 'empty', matches: [] }; return }
  qc.value = { state: 'checking', matches: [] }
  qcTimer = setTimeout(async () => {
    try {
      const matches = await r2Service.findUrlDuplicates(v)
      qc.value = matches.length ? { state: 'duplicate', matches } : { state: 'unique', matches: [] }
    } catch (e) {
      qc.value = { state: 'error', matches: [] }
    }
  }, 400)
}
function goReport(id: string) { router.push({ name: 'ReportDetail', params: { id } }) }
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
/* Quick check styles */
.quick-check { margin:1.25rem auto 0; display:flex; gap:.75rem; justify-content:center; align-items:stretch; max-width:900px; }
.quick-check .qc-input { flex:1; padding:.8rem 1rem; border:2px solid var(--border); background:var(--bg-tertiary); color:var(--text-primary); border-radius:.65rem; font-size:.95rem; }
.quick-check .qc-input:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 3px rgba(99,102,241,0.25); }
.qc-status { position:relative; font-size:.75rem; font-weight:600; padding:.55rem .8rem; border-radius:.55rem; background:var(--bg-secondary); color:var(--text-secondary); min-width:120px; display:flex; align-items:center; justify-content:center; }
.qc-status.checking { background:#1e2734; color:#60a5fa; }
.qc-status.unique { background:#173d22; color:#4ade80; }
.qc-status.duplicate { background:#40210e; color:#fbbf24; cursor:pointer; }
.qc-status.error { background:#3f141a; color:#f87171; }
.qc-status.empty { background:var(--bg-tertiary); color:var(--text-muted); }
.qc-status .qc-pop { display:none; position:absolute; top:110%; right:0; background:var(--bg-secondary); padding:.75rem .9rem; border-radius:.6rem; width:340px; box-shadow:0 10px 26px rgba(0,0,0,.5); z-index:50; font-size:.7rem; text-align:left; }
.qc-status.duplicate:hover .qc-pop { display:block; }
.qc-status .qc-pop ul { list-style:none; padding:0; margin:.5rem 0 0; max-height:210px; overflow:auto; display:flex; flex-direction:column; gap:.45rem; }
.qc-status .qc-pop li { display:flex; flex-direction:column; background:var(--bg-tertiary); padding:.45rem; border-radius:.45rem; transition:background .15s; cursor:pointer; }
.qc-status .qc-pop li:hover { background:var(--bg-secondary); }
.qc-status .qc-pop li .t { color:var(--text-primary); font-weight:500; }
.qc-status .qc-pop li .r { color:var(--text-secondary); font-size:.65rem; }
.qc-status .qc-pop li .d { color:var(--text-muted); font-size:.6rem; }

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

/* Enhanced report card */
.report-card.enhanced { position:relative; display:flex; align-items:stretch; gap:.75rem; cursor:pointer; background:linear-gradient(145deg,var(--bg-secondary) 0%,var(--bg-tertiary) 120%); border:1px solid var(--border); border-radius:1rem; padding:1rem 1.15rem 1rem; overflow:hidden; transition:var(--transition-base, .28s ease); }
.report-card.enhanced:before { content:""; position:absolute; inset:0; background:linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0)); pointer-events:none; }
.report-card.enhanced:hover { transform:translateY(-3px); box-shadow:0 10px 32px -6px rgba(0,0,0,.55); border-color:var(--accent); }
.report-card.enhanced[data-empty="true"] { opacity:.55; }
.report-card.enhanced[data-empty="true"]:hover { opacity:.7; }

.rc-body { flex:1; display:flex; flex-direction:column; gap:.55rem; position:relative; }
.rc-top { display:flex; justify-content:space-between; gap:.85rem; align-items:flex-start; }
.rc-title-block { display:flex; flex-direction:column; min-width:0; }
.rc-title { margin:0; font-size:1.02rem; font-weight:600; letter-spacing:.35px; color:var(--text-primary); line-height:1.15; max-width:56ch; overflow:hidden; text-overflow:ellipsis; }
.rc-time { font-size:.7rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:600; }
.rc-delta { background:rgba(16,185,129,0.12); color:var(--success); border:1px solid rgba(16,185,129,0.35); font-size:.65rem; padding:.4rem .55rem; border-radius:.75rem; font-weight:700; display:flex; align-items:center; letter-spacing:.6px; }

.rc-kpis { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(54px,auto); gap:.55rem; align-items:stretch; overflow-x:auto; padding-bottom:.1rem; }
.rc-kpis::-webkit-scrollbar { height:6px; }
.rc-kpis::-webkit-scrollbar-thumb { background: var(--bg-tertiary); border-radius:4px; }
.rc-kpis .kpi { position:relative; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:.7rem; padding:.45rem .5rem .5rem; display:flex; flex-direction:column; gap:.15rem; min-width:54px; }
.rc-kpis .kpi:before { content:""; position:absolute; inset:0; background:linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0)); pointer-events:none; border-radius:inherit; }
.rc-kpis .kv { font-size:.95rem; font-weight:600; line-height:1; color:var(--text-primary); display:flex; align-items:flex-end; gap:.25rem; }
.rc-kpis .kv.plus { color:var(--success); }
.rc-kpis .kv.minus { color:var(--danger); }
.rc-kpis .ksub { font-size:.55rem; font-weight:600; letter-spacing:.8px; text-transform:uppercase; color:var(--success); line-height:1; }
.rc-kpis .kl { font-size:.55rem; letter-spacing:.9px; text-transform:uppercase; font-weight:600; color:var(--text-secondary); line-height:1; }
.rc-kpis .kpi.faded { opacity:.4; }
.rc-kpis .kpi.total { background:rgba(59,130,246,0.06); border-color:rgba(59,130,246,0.4); }
.rc-kpis .kpi.moved { background:rgba(16,185,129,0.08); border-color:rgba(16,185,129,0.4); }
.rc-kpis .kpi.static { background:rgba(100,116,139,0.08); border-color:rgba(100,116,139,0.35); }
.rc-kpis .kpi.unmarked { background:rgba(234,179,8,0.07); border-color:rgba(234,179,8,0.45); }
.rc-kpis .kpi.growth { background:rgba(16,185,129,0.05); border-color:rgba(16,185,129,0.35); }
.rc-kpis .kpi.decline { background:rgba(239,68,68,0.06); border-color:rgba(239,68,68,0.4); }

.rc-progress { margin-top:.2rem; }
.rc-progress .bar { position:relative; height:7px; width:100%; border:1px solid var(--border); background:var(--bg-tertiary); border-radius:6px; display:flex; overflow:hidden; }
.rc-progress .seg { height:100%; transition:width .55s cubic-bezier(.55,.1,.3,1); }
.rc-progress .seg.moved { background:linear-gradient(90deg, rgba(16,185,129,0.95), rgba(16,185,129,0.55)); }
.rc-progress .seg.static { background:linear-gradient(90deg, rgba(107,114,128,0.7), rgba(107,114,128,0.3)); }
.rc-progress .seg.unmarked { background:linear-gradient(90deg, rgba(234,179,8,0.75), rgba(234,179,8,0.35)); }

/* Removed rc-hover overlay styles */

.rc-actions { display:flex; align-items:flex-start; }
.rc-actions .btn-danger-outline { margin-top:.2rem; }

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