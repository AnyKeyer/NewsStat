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

        <!-- Фильтрация новостей -->
        <div class="news-filter-section card glass fade-in" v-if="allNews.length">
          <div class="news-filter-header">
            <h2>Новости (фильтр)</h2>
            <div class="results-chip" v-if="allNews.length">{{ filteredNews.length }} / {{ allNews.length }}</div>
          </div>
          <div class="filter-toolbar">
            <div class="filter-block">
              <span class="fb-label">Направление</span>
              <div class="segmented">
                <button type="button" :class="{active: newsDirection==='all'}" @click="newsDirection='all'">Все</button>
                <button type="button" :class="{active: newsDirection==='positive'}" @click="newsDirection='positive'">▲ Позитив</button>
                <button type="button" :class="{active: newsDirection==='negative'}" @click="newsDirection='negative'">▼ Негатив</button>
              </div>
            </div>
            <div class="filter-block">
              <span class="fb-label">Сортировка</span>
              <select v-model="newsSort" class="select">
                <option value="abs">Абс. влияние</option>
                <option value="growth">Рост (max→)</option>
                <option value="decline">Падение (min→)</option>
                <option value="newest">Новые</option>
                <option value="oldest">Старые</option>
              </select>
            </div>
            <div class="filter-block wide">
              <span class="fb-label">Порог |impact| ≥ {{ minAbsImpact }}</span>
              <div class="impact-row">
                <input class="range" type="range" min="0" max="30" step="0.5" v-model.number="minAbsImpact" />
                <input class="mini-number" type="number" min="0" max="30" step="0.5" v-model.number="minAbsImpact" />
                <div class="quick-thresholds">
                  <button type="button" v-for="v in [5,10,15,20]" :key="v" :class="{active: minAbsImpact===v}" @click="minAbsImpact=v">≥{{ v }}</button>
                  <button type="button" :class="{active: minAbsImpact===0}" @click="minAbsImpact=0">Сброс</button>
                </div>
              </div>
            </div>
            <div class="filter-block grow">
              <span class="fb-label">Поиск</span>
              <div class="search-box">
                <span class="icon">🔍</span>
                <input type="text" v-model="newsSearch" placeholder="Токен или слово в заголовке..." />
                <button v-if="newsSearch" type="button" class="clear" @click="newsSearch=''" title="Очистить">✕</button>
              </div>
            </div>
            <div class="filter-block small">
              <span class="fb-label">Top N</span>
              <select v-model.number="newsTopN" class="select">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
            <div class="filter-block actions-col">
              <button type="button" class="btn-ghost" @click="resetFilters">Сбросить</button>
            </div>
          </div>
          <div class="news-table-wrapper">
            <table class="news-table">
              <thead>
                <tr>
                  <th style="width:70px;">Токен</th>
                  <th style="width:80px;">Импакт</th>
                  <th>Заголовок</th>
                  <th style="width:110px;">Время</th>
                  <th style="width:140px;">Отчет</th>
                </tr>
              </thead>
              <tbody v-if="filteredNews.length">
                <tr v-for="n in filteredNews" :key="n.id + n.reportId" :class="{ 'row-pos': n.impact>0, 'row-neg': n.impact<0 }">
                  <td class="col-token"><span class="token-tag">{{ n.tokenName || '—' }}</span></td>
                  <td class="impact-cell col-impact" :class="{ 'impact-pos': n.impact>0, 'impact-neg': n.impact<0 }">
                    <span v-if="n.impact>0">+{{ n.impact.toFixed(2) }}%</span>
                    <span v-else-if="n.impact<0">{{ n.impact.toFixed(2) }}%</span>
                    <span v-else>0%</span>
                  </td>
                  <td class="col-title">
                    <div class="news-title" :title="n.title">{{ n.title }}</div>
                  </td>
                  <td class="col-date">{{ formatNewsDate(n.date) }}</td>
                  <td class="col-report">
                    <router-link class="report-chip" :title="n.reportTitle" :aria-label="'Открыть отчет ' + n.reportTitle" :to="{ name: 'ReportDetail', params: { id: n.reportId } }">
                      <span class="rc-icon">📄</span>
                      <span class="rc-text" :title="n.reportTitle">{{ n.reportTitle }}</span>
                      <span class="rc-open" aria-hidden="true">↗</span>
                    </router-link>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr><td colspan="5" class="no-results">Ничего не найдено под условия</td></tr>
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
interface FlatNewsItem { id:string; reportId:string; reportTitle:string; tokenName:string; impact:number; date:Date; title:string }

const reportStore = useReportStore()
const loadingAll = ref(false)
const error = ref<string | null>(null)
const fullReportsCache = ref<Map<string, any>>(new Map())
const dailyAggregates = ref<DailyAggregate[]>([])
const allNews = ref<FlatNewsItem[]>([])
// Фильтры новостей
const newsDirection = ref<'all' | 'positive' | 'negative'>('all')
const newsSort = ref<'abs' | 'growth' | 'decline' | 'newest' | 'oldest'>('abs')
const minAbsImpact = ref(0)
const newsSearch = ref('')
const newsTopN = ref(50)
const filteredNews = computed(() => {
  let list = allNews.value
  if (newsDirection.value === 'positive') list = list.filter(n => n.impact>0)
  else if (newsDirection.value === 'negative') list = list.filter(n => n.impact<0)
  if (minAbsImpact.value>0) list = list.filter(n => Math.abs(n.impact) >= minAbsImpact.value)
  if (newsSearch.value.trim()) {
    const q = newsSearch.value.trim().toLowerCase()
    list = list.filter(n => n.tokenName.toLowerCase().includes(q) || n.title.toLowerCase().includes(q))
  }
  list = [...list]
  switch (newsSort.value) {
    case 'abs': list.sort((a,b)=> Math.abs(b.impact) - Math.abs(a.impact)); break
    case 'growth': list.sort((a,b)=> b.impact - a.impact); break
    case 'decline': list.sort((a,b)=> a.impact - b.impact); break
    case 'newest': list.sort((a,b)=> b.date.getTime() - a.date.getTime()); break
    case 'oldest': list.sort((a,b)=> a.date.getTime() - b.date.getTime()); break
  }
  return list.slice(0, newsTopN.value)
})
function formatNewsDate(d: Date){ return new Intl.DateTimeFormat('ru-RU',{ day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}).format(d) }
function resetFilters(){ newsDirection.value='all'; newsSort.value='abs'; minAbsImpact.value=0; newsSearch.value=''; newsTopN.value=50 }

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
  const flat: FlatNewsItem[] = []
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
        flat.push({ id: n.id, reportId: report.id, reportTitle: report.title, tokenName: (n.tokenName||'').toUpperCase(), impact: n.impact, date: new Date(n.date), title: n.title })
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
  allNews.value = flat

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

/* Redesigned filter section */
.news-filter-section { margin-top:2.75rem; }
.news-filter-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1.1rem; }
.news-filter-header h2 { margin:0; font-size:1.35rem; }
.results-chip { background:var(--bg-tertiary); border:1px solid var(--border); padding:.4rem .7rem; border-radius:999px; font-size:.7rem; letter-spacing:.5px; font-weight:600; color:var(--text-secondary); }

.filter-toolbar { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1rem 1.2rem; margin-bottom:1.1rem; }
.filter-block { display:flex; flex-direction:column; gap:.45rem; }
.filter-block.grow { min-width:260px; }
.filter-block.wide { grid-column: span 2; min-width:340px; }
@media (max-width:900px){ .filter-block.wide { grid-column: span 1; } }
.filter-block.small { max-width:140px; }
.fb-label { font-size:.6rem; text-transform:uppercase; letter-spacing:.6px; font-weight:700; color:var(--text-secondary); }

.segmented { display:inline-flex; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:.65rem; overflow:hidden; }
.segmented button { background:transparent; color:var(--text-secondary); padding:.55rem .8rem; font-size:.7rem; font-weight:600; letter-spacing:.3px; border:0; cursor:pointer; position:relative; transition:background .2s,color .2s; }
.segmented button + button { border-left:1px solid var(--border); }
.segmented button.active { background:var(--accent); color:#fff; }
.segmented button:not(.active):hover { background:rgba(255,255,255,0.06); color:var(--text-primary); }

.select { width:100%; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:.6rem; padding:.55rem .7rem; font-size:.75rem; color:var(--text-primary); }
.select:focus { outline:2px solid var(--accent); outline-offset:2px; }

.impact-row { display:flex; flex-wrap:wrap; gap:.6rem; align-items:center; }
.range { flex:1 1 140px; }
.mini-number { width:70px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:.55rem; padding:.45rem .5rem; font-size:.75rem; color:var(--text-primary); }
.mini-number:focus { outline:2px solid var(--accent); outline-offset:1px; }

.quick-thresholds { display:flex; gap:.4rem; flex-wrap:wrap; }
.quick-thresholds button { background:var(--bg-tertiary); border:1px solid var(--border); border-radius:.6rem; padding:.42rem .65rem; font-size:.58rem; font-weight:600; letter-spacing:.55px; cursor:pointer; transition:background .2s, color .2s, border-color .2s, box-shadow .2s; color:var(--text-primary); opacity:.78; }
.quick-thresholds button.active { background:var(--accent); color:#fff; border-color:var(--accent); opacity:1; box-shadow:0 0 0 1px var(--accent), 0 4px 10px -4px rgba(0,0,0,.4); }
.quick-thresholds button:hover:not(.active) { background:rgba(255,255,255,0.09); opacity:.95; }

.search-box { position:relative; display:flex; align-items:center; background:var(--bg-tertiary); border:1px solid var(--border); padding:.35rem .55rem; border-radius:.65rem; gap:.4rem; }
.search-box .icon { font-size:.8rem; opacity:.7; }
.search-box input { flex:1; background:transparent; border:0; outline:none; color:var(--text-primary); font-size:.75rem; }
.search-box .clear { background:transparent; border:0; cursor:pointer; font-size:.75rem; opacity:.55; transition:opacity .2s; }
.search-box .clear:hover { opacity:.95; }

.btn-ghost { background:var(--bg-tertiary); border:1px solid var(--border); padding:.55rem .8rem; border-radius:.6rem; font-size:.7rem; font-weight:600; cursor:pointer; color:var(--text-secondary); transition:all .2s; }
.btn-ghost:hover { background:var(--accent); color:#fff; border-color:var(--accent); }

.news-table { width:100%; border-collapse:separate; border-spacing:0 4px; }
.news-table thead th { background:var(--bg-tertiary); position:sticky; top:0; z-index:5; color:var(--text-primary); }
.news-table thead::after { content:''; position:absolute; left:0; right:0; bottom:-1px; height:1px; background:linear-gradient(90deg, transparent, var(--border), transparent); }
.news-table tbody tr { background:rgba(255,255,255,0.04); transition:background .18s, transform .18s; border-radius:.6rem; backdrop-filter:blur(4px); }
.news-table tbody tr:nth-child(2n) { background:rgba(255,255,255,0.04); }
.news-table tbody tr:hover { background:rgba(255,255,255,0.08); }
.news-table tbody tr.row-pos, .news-table tbody tr.row-neg { position:relative; }
.news-table tbody tr.row-pos:before, .news-table tbody tr.row-neg:before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; border-radius:.75rem 0 0 .75rem; }
.news-table tbody tr.row-pos:before { background:linear-gradient(180deg,var(--success) 0%, rgba(16,185,129,0.4) 100%); }
.news-table tbody tr.row-neg:before { background:linear-gradient(180deg,var(--danger) 0%, rgba(239,68,68,0.45) 100%); }
.news-table tbody tr.row-pos { box-shadow:0 0 0 1px rgba(16,185,129,0.18); }
.news-table tbody tr.row-neg { box-shadow:0 0 0 1px rgba(239,68,68,0.2); }
.news-title { font-size:.7rem; line-height:1.25; max-width:520px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; position:relative; z-index:0; color:var(--text-primary); }
.token-tag { background:var(--bg-tertiary); border:1px solid var(--border); padding:.32rem .62rem; border-radius:.7rem; font-size:.6rem; font-weight:600; letter-spacing:.55px; display:inline-flex; align-items:center; gap:.28rem; position:relative; z-index:1; line-height:1; color:var(--text-primary); }
.token-tag:before { content:'#'; opacity:.5; }
.impact-cell { font-weight:600; font-size:.68rem; font-variant-numeric:tabular-nums; color:var(--text-primary); }
.impact-cell span { display:inline-block; padding:.3rem .6rem; border-radius:.65rem; background:var(--bg-tertiary); box-shadow:inset 0 0 0 1px var(--border); min-width:60px; text-align:center; position:relative; z-index:0; color:var(--text-primary); }
.impact-pos span { background:rgba(16,185,129,0.12); box-shadow:inset 0 0 0 1px rgba(16,185,129,0.35); color:var(--success); }
.impact-neg span { background:rgba(239,68,68,0.12); box-shadow:inset 0 0 0 1px rgba(239,68,68,0.35); color:var(--danger); }
.no-results { background:var(--bg-tertiary); font-size:.7rem; letter-spacing:.5px; }

.report-chip { display:inline-flex; align-items:center; max-width:100%; gap:.4rem; background:var(--bg-terтиary); border:1px solid var(--border); padding:.45rem .6rem .45rem .55rem; border-radius:.65rem; text-decoration:none; color:var(--text-primary); font-size:.58rem; font-weight:600; letter-spacing:.55px; position:relative; line-height:1; transition:background .2s,border-color .2s,box-shadow .2s; }
.report-chip:hover { background:var(--accent); border-color:var(--accent); box-shadow:0 4px 12px -4px rgba(0,0,0,.45); }
.report-chip:hover .rc-open { transform:translateX(2px); opacity:1; }
.report-chip:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.rc-icon { font-size:.7rem; opacity:.8; flex:0 0 auto; }
.rc-text { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
.rc-open { font-size:.6rem; opacity:.6; transition:transform .25s, opacity .25s; display:inline-block; }

.col-token { width:74px; }
.col-impact { width:88px; }
.col-date { width:110px; font-variant-numeric:tabular-nums; }
.col-report { width:180px; }

/* tighten existing spacing if needed */
.news-table td { padding:.55rem .7rem; }
.news-table thead th { font-size:.62rem; letter-spacing:.6px; font-weight:600; }
</style>
