<template>
  <div class="report-detail">
    <!-- Загрузка -->
    <div v-if="reportStore.loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Загрузка отчета...</p>
    </div>

    <!-- Ошибка -->
    <div v-else-if="reportStore.error" class="error-state">
      <div class="error-message">
        <h3>❌ Ошибка загрузки</h3>
        <p>{{ reportStore.error }}</p>
        <div class="error-actions">
          <button @click="loadReport" class="btn btn-primary">Попробовать снова</button>
          <router-link to="/" class="btn btn-secondary">Назад</router-link>
        </div>
      </div>
    </div>

    <!-- Отчет -->
    <div v-else-if="report" class="report-content">
      <!-- Заголовок отчета -->
      <div class="report-header">
        <div class="header-content">
          <h1>{{ report.title }}</h1>
          <p v-if="report.description" class="report-description">{{ report.description }}</p>
          <div class="report-meta">
            <span class="meta-item">
              📅 {{ formatDate(report.createdAt) }}
            </span>
            <span
              v-if="report.updatedAt && report.updatedAt.getTime() !== report.createdAt.getTime()"
              class="meta-item"
              :title="'Обновлено: ' + formatDate(report.updatedAt as Date)"
            >
              🔄 {{ formatDate(report.updatedAt as Date) }}
            </span>
            <span v-if="report.createdBy" class="meta-item">
              👤 {{ report.createdBy }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <router-link to="/" class="btn btn-secondary back-btn">← Назад</router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            :to="{ name: 'EditReport', params: { id: report.id } }"
            class="btn btn-primary edit-btn"
          >✏️ Редактировать</router-link>
        </div>
      </div>

      <!-- Статистика (карточка) -->
      <div v-if="statistics" class="statistics-section">
        <ReportStatsCard :stats="statistics" subtitle="Сводка сигналов" />
      </div>

      <!-- Список новостей -->
      <div class="news-section">
        <h2>📰 Новости в отчете ({{ report.news.length }})</h2>
        
        <div class="news-filters">
          <button 
            @click="newsFilter = 'all'"
            :class="['btn','btn-sm', newsFilter === 'all' ? 'btn-gradient' : 'btn-outline']"
          >
            Все ({{ report.news.length }})
          </button>
          <button 
            @click="newsFilter = 'moved'"
            :class="['btn','btn-sm', newsFilter === 'moved' ? 'btn-success' : 'btn-outline']"
          >
            Сдвиг ({{ report.news.filter(n => n.priceMoved === true).length }})
          </button>
          <button 
            @click="newsFilter = 'static'"
            :class="['btn','btn-sm', newsFilter === 'static' ? 'btn-secondary' : 'btn-outline']"
          >
            Без сдвига ({{ report.news.filter(n => n.priceMoved === false).length }})
          </button>
          <button 
            @click="newsFilter = 'unmarked'"
            :class="['btn','btn-sm', newsFilter === 'unmarked' ? 'btn-warning' : 'btn-outline']"
            v-if="report.news.some(n => n.priceMoved === undefined)"
          >
            ? ({{ report.news.filter(n => n.priceMoved === undefined).length }})
          </button>
          <button
            @click="newsFilter = 'software'"
            :class="['btn','btn-sm', newsFilter === 'software' ? 'btn-primary' : 'btn-outline']"
          >
            Софт ({{ report.news.filter(n => n.needsSoftware === true).length }})
          </button>
        </div>
        <div v-if="uniqueHashtags.length" class="hashtag-filter-bar">
          <span class="hf-label">Хэштеги:</span>
          <button
            type="button"
            class="hf-tag"
            :class="{ active: activeHashtag === null }"
            @click="activeHashtag = null"
          >Все</button>
          <button
            v-for="tag in uniqueHashtags"
            :key="tag"
            type="button"
            class="hf-tag"
            :class="{ active: activeHashtag === tag }"
            @click="activeHashtag = (activeHashtag === tag ? null : tag)"
          >#{{ tag }}</button>
        </div>

        <div class="news-list">
          <div
            v-for="newsItem in filteredNews"
            :key="newsItem.id"
            :class="['news-card','card','card-hover','fade-in', impactClass(newsItem)]"
          >
            <div class="news-card-inner">
              <div class="news-header">
                <div class="title-block">
                  <h3 class="news-title">{{ newsItem.title }}</h3>
                  <div class="token-badges">
                    <template v-if="newsItem.tokenName">
                      <a v-if="newsItem.tokenUrl"
                         :href="newsItem.tokenUrl"
                         target="_blank"
                         rel="noopener"
                         :class="['badge','token-badge','token-badge-link', impactTone(newsItem)]"
                         :title="'Открыть страницу токена'"
                      >{{ newsItem.tokenName }}</a>
                      <span v-else :class="['badge','token-badge', impactTone(newsItem)]">{{ newsItem.tokenName }}</span>
                    </template>
                    <span class="badge warning token-badge" v-if="newsItem.needsSoftware" title="Без софта не взять">⚙️ Софт</span>
                  </div>
                </div>
                <div class="impact-badge" :class="impactClass(newsItem)">
                  <span v-if="newsItem.priceMoved === true" class="move-icon moved" title="Цена двигалась">✓</span>
                  <span v-else-if="newsItem.priceMoved === false" class="move-icon static" title="Без движения">—</span>
                  <span v-else class="move-icon unmarked" title="Не отмечено">?</span>
                  <span v-if="newsItem.impact > 0">▲</span>
                  <span v-else-if="newsItem.impact < 0">▼</span>
                  <span v-else>○</span>
                  {{ formattedImpact(newsItem.impact) }}
                </div>
              </div>

              <div class="news-text">{{ newsItem.text }}</div>


              <div v-if="newsItem.comment" class="news-comment">
                <strong>Комментарий:</strong> {{ newsItem.comment }}
              </div>

              <div v-if="newsItem.screenshotUrl" class="extra-links">
                <a :href="newsItem.screenshotUrl" target="_blank" rel="noopener" class="screenshot-link">🖼️ Скрин</a>
              </div>
              <div v-if="resolvedScreenshotUrl(newsItem.screenshotUrl)" class="screenshot-preview">
                <img :src="resolvedScreenshotUrl(newsItem.screenshotUrl) || ''" @error="onImageError($event)" alt="Скриншот" loading="lazy" />
              </div>

              <div class="news-footer">
                <a
                  :href="newsItem.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="news-link"
                >
                  🔗 Источник
                </a>
                <span class="news-date" :title="isoString(newsItem.date)">{{ formatDateTime(newsItem.date) }}</span>
              </div>
              <div v-if="newsItem.hashtags && newsItem.hashtags.length" class="tags-section">
                <span class="tags-label">Теги:</span>
                <div class="tags-chips">
                  <button
                    v-for="h in newsItem.hashtags"
                    :key="h"
                    type="button"
                    class="tag-chip"
                    :class="{ active: activeHashtag === h.toLowerCase() }"
                    @click="activeHashtag = (activeHashtag === h.toLowerCase() ? null : h.toLowerCase())"
                    :title="activeHashtag === h.toLowerCase() ? 'Снять фильтр' : 'Фильтр по #' + h"
                  >#{{ h }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <button
    v-if="report"
    class="floating-refresh"
    @click="loadReport"
    :disabled="reportStore.loading"
    title="Обновить отчет"
    aria-label="Обновить отчет"
  >
    <span v-if="!reportStore.loading">🔄</span>
    <span v-else class="spin">⟳</span>
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useReportStore } from '@/stores/reports'
import { useAuthStore } from '@/stores/auth'
import metaService from '@/services/metaService'
import ReportStatsCard from '@/components/ReportStatsCard.vue'

interface Props {
  id: string
}

const props = defineProps<Props>()
const route = useRoute()
const reportStore = useReportStore()
const authStore = useAuthStore()

const newsFilter = ref<'all' | 'moved' | 'static' | 'unmarked' | 'software'>('all')
const activeHashtag = ref<string | null>(null)

const report = computed(() => reportStore.currentReport)
const statistics = computed(() => reportStore.reportStatistics)

const filteredNews = computed(() => {
  if (!report.value) return []
  let base = report.value.news
  switch (newsFilter.value) {
    case 'moved': base = base.filter(n => n.priceMoved === true); break
    case 'static': base = base.filter(n => n.priceMoved === false); break
    case 'unmarked': base = base.filter(n => n.priceMoved === undefined); break
    case 'software': base = base.filter(n => n.needsSoftware === true); break
  }
  if (activeHashtag.value) {
    base = base.filter(n => (n.hashtags||[]).map(h=>h.toLowerCase()).includes(activeHashtag.value as string))
  }
  return base
})

const uniqueHashtags = computed(() => {
  if (!report.value) return []
  return Array.from(new Set(report.value.news.flatMap(n => (n.hashtags||[]).map(h=> h.toLowerCase())))).sort()
})

function impactClass(n: { impact: number }) {
  if (n.impact > 0) return 'positive'
  if (n.impact < 0) return 'negative'
  return 'neutral'
}

function formattedImpact(v: number) {
  if (v > 0) return `+${v.toFixed(2)}%`
  if (v < 0) return `${v.toFixed(2)}%`
  return '0%'
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function formatDateTime(date: Date): string {
  // Более компактный формат для новостей
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

function isoString(date: Date): string {
  return date.toISOString()
}

function resolvedScreenshotUrl(raw?: string): string | null {
  if (!raw) return null
  // Только прямой файл с поддерживаемым расширением
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(raw.split('?')[0])) return raw
  return null
}

function onImageError(e: Event) {
  const el = e.target as HTMLImageElement
  if (!el.dataset.retried && el.src.endsWith('.png')) {
    el.dataset.retried = '1'
    // попробуем jpg
    el.src = el.src.replace(/\.png$/, '.jpg')
  } else {
    el.closest('.screenshot-preview')?.classList.add('load-error')
  }
}

function impactTone(n: { impact: number }) {
  if (n.impact > 0) return 'tone-positive'
  if (n.impact < 0) return 'tone-negative'
  return 'tone-neutral'
}

async function loadReport() {
  const reportId = props.id || route.params.id as string
  if (reportId) {
    await reportStore.loadReport(reportId)
  }
}

// Обновляем мета-теги когда отчет и статистика загружены
watch([report, statistics], ([currentReport, currentStats]) => {
  if (currentReport && currentStats) {
    metaService.updateReportMeta(currentReport, currentStats)
  }
}, { immediate: true })

onMounted(() => {
  loadReport()
})

onUnmounted(() => {
  // Возвращаем дефолтные мета-теги при уходе со страницы
  metaService.resetToDefault()
})
</script>

<style scoped>
.loading-state, .error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  flex-direction: column;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--bg-tertiary);
  border-top: 4px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
  background: var(--bg-secondary);
  border: 1px solid var(--danger);
  border-radius: 0.5rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}
.header-actions { display:flex; gap:.75rem; flex-wrap:wrap; }
.header-actions .btn { min-width:110px; justify-content:center; }

.header-content h1 {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.report-description {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.6;
}

.report-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.statistics-section {
  margin-bottom: 3rem;
}


.news-section h2 {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.news-filters { display:flex; gap:.5rem; margin-bottom:2rem; flex-wrap:wrap; }

.news-list { display:flex; flex-direction:column; gap:1rem; }
.news-card { position:relative; padding:1.15rem 1.15rem 1.1rem; border-left:4px solid transparent; }
.news-card.positive { border-left-color: var(--success); }
.news-card.negative { border-left-color: var(--danger); }
.news-card.neutral { border-left-color: var(--border); }
.news-card .news-card-inner { display:flex; flex-direction:column; gap:.75rem; }
.news-header { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; }
.title-block { flex:1; min-width:0; }
.news-title { margin:0 0 .25rem; font-size:1rem; line-height:1.3; color:var(--text-primary); }
.token-badges { display:flex; gap:.4rem; flex-wrap:wrap; }
.token-badge { 
  font-size:.75rem; 
  letter-spacing:.7px; 
  padding:.45rem .7rem; 
  font-weight:700; 
  text-transform:uppercase; 
  border-radius:.7rem; 
  background:linear-gradient(135deg,var(--accent) 0%, var(--accent) 55%, var(--accent) 100%);
  box-shadow:0 2px 6px -2px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 2px rgba(99,102,241,0.25);
  position:relative;
  display:inline-flex; align-items:center; gap:.3rem;
}
.token-badge.tone-positive { background:linear-gradient(135deg,var(--success) 0%, rgba(16,185,129,0.85) 60%, var(--success) 100%); box-shadow:0 2px 8px -2px rgba(16,185,129,.55), 0 0 0 1px rgba(16,185,129,.4), 0 0 0 3px rgba(16,185,129,.15); color:#fff; }
.token-badge.tone-negative { background:linear-gradient(135deg,var(--danger) 0%, rgba(239,68,68,0.85) 60%, var(--danger) 100%); box-shadow:0 2px 8px -2px rgba(239,68,68,.55), 0 0 0 1px rgba(239,68,68,.4), 0 0 0 3px rgba(239,68,68,.18); color:#fff; }
.token-badge.tone-neutral { background:linear-gradient(135deg,var(--bg-tertiary) 0%, var(--bg-secondary) 60%, var(--bg-tertiary) 100%); box-shadow:0 2px 6px -2px rgba(0,0,0,.5), inset 0 0 0 1px var(--border); color:var(--text-primary); }
.token-badge.token-badge-link { 
  text-decoration:none; 
  transition:.22s box-shadow,.22s transform,.22s filter; 
  cursor:pointer;
}
.token-badge.token-badge-link:hover { 
  transform:translateY(-2px); 
  filter:brightness(1.07);
  box-shadow:0 6px 18px -6px rgba(0,0,0,.65), 0 0 0 1px var(--accent), 0 0 0 5px rgba(99,102,241,0.35);
}
.token-badge.token-badge-link:active { transform:translateY(0) scale(.95); filter:brightness(.94); }
.token-badge.token-badge-link::after { content:'↗'; font-size:.55rem; opacity:.8; }
.impact-badge { display:flex; align-items:center; gap:.35rem; font-size:.8rem; font-weight:600; padding:.45rem .7rem; border-radius:999px; background:var(--bg-tertiary); box-shadow:inset 0 0 0 1px var(--border); }
.impact-badge.positive { color:var(--success); box-shadow:inset 0 0 0 1px rgba(16,185,129,.4); }
.impact-badge.negative { color:var(--danger); box-shadow:inset 0 0 0 1px rgba(239,68,68,.4); }
.impact-badge.neutral { color:var(--text-secondary); }
.impact-badge .move-icon { font-size:.8rem; line-height:1; opacity:.9; }
.impact-badge .move-icon.moved { color: var(--success); }
.impact-badge .move-icon.static { color: var(--text-secondary); }
.impact-badge .move-icon.unmarked { color: var(--warning, #eab308); }
.token-badge.badge.warning { background: rgba(234,179,8,0.15); border-color: rgba(234,179,8,0.55); color:#eab308; }
.badge.warning { background: var(--warning, #eab308); color:#000; border-color: var(--warning, #eab308); }
.news-text { color:var(--text-secondary); line-height:1.55; white-space:pre-line; }
.news-comment { 
  position:relative;
  color:var(--text-secondary);
  font-size:.9rem;
  line-height:1.5;
  background:linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 65%, rgba(255,255,255,0.07) 100%), var(--bg-tertiary);
  border:1px solid var(--border);
  padding:.8rem .95rem .85rem;
  border-radius:.85rem;
  box-shadow:0 3px 6px -2px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,0.05);
  overflow:hidden;
}
.news-card.positive .news-comment { border-color:rgba(16,185,129,.45); box-shadow:0 2px 6px -2px rgba(16,185,129,.35), inset 0 0 0 1px rgba(16,185,129,.25); }
.news-card.negative .news-comment { border-color:rgba(239,68,68,.5); box-shadow:0 2px 6px -2px rgba(239,68,68,.38), inset 0 0 0 1px rgba(239,68,68,.28); }
.news-comment strong { color:var(--accent); font-weight:600; letter-spacing:.4px; }
.news-card.positive .news-comment strong { color:var(--success); }
.news-card.negative .news-comment strong { color:var(--danger); }
.news-footer { display:flex; justify-content:space-between; align-items:center; gap:.75rem; margin-top:.25rem; }
.news-link { color:var(--accent); font-weight:500; text-decoration:none; }
.news-link:hover { text-decoration:underline; }
.news-date { color:var(--text-muted); font-size:.7rem; letter-spacing:.5px; text-transform:uppercase; }

/* Hashtag filtering */
.hashtag-filter-bar { display:flex; flex-wrap:wrap; gap:.4rem; margin:-.5rem 0 1.5rem; align-items:center; }
.hf-label { font-size:.7rem; text-transform:uppercase; letter-spacing:.7px; color:var(--text-muted); margin-right:.25rem; }
.hf-tag { background:var(--bg-tertiary); border:1px solid var(--border); color:var(--text-secondary); font-size:.65rem; padding:.4rem .7rem; border-radius:1rem; cursor:pointer; font-weight:600; letter-spacing:.4px; }
.hf-tag.active { background:var(--accent); color:#fff; border-color:var(--accent); box-shadow:0 2px 8px -2px rgba(0,0,0,.5); }
.hf-tag:hover { background:var(--accent); color:#fff; border-color:var(--accent); }

.news-hashtags { display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.15rem; }
.news-hashtag-chip { background:var(--bg-tertiary); border:1px solid var(--border); padding:.25rem .55rem; font-size:.6rem; border-radius:1rem; cursor:pointer; color:var(--text-secondary); font-weight:600; letter-spacing:.4px; }
.news-hashtag-chip:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
.news-hashtag-chip:active { transform:scale(.92); }
/* Inline hashtags in header */
/* Tags section at bottom of card */
/* Refined simpler tags section */
.tags-section { margin-top:.85rem; padding:.55rem .7rem .65rem; background:var(--bg-secondary); border:1px solid var(--border); border-radius:.65rem; display:flex; flex-wrap:wrap; gap:.6rem; align-items:flex-start; }
.tags-label { font-size:.62rem; text-transform:uppercase; letter-spacing:.85px; font-weight:600; color:var(--text-muted); padding:.2rem .45rem; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:.4rem; align-self:center; }
.tags-chips { display:flex; flex-wrap:wrap; gap:.45rem; }
.tag-chip { 
  background:var(--bg-tertiary);
  border:1px solid var(--border);
  padding:.38rem .65rem .4rem;
  font-size:.57rem;
  border-radius:.9rem;
  cursor:pointer;
  color:var(--text-secondary);
  font-weight:600;
  letter-spacing:.5px;
  line-height:1;
  text-transform:uppercase;
  display:inline-flex;
  align-items:center;
  gap:.25rem;
  transition:.18s background,.18s color,.18s border-color,.18s transform;
}
.tag-chip:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
.tag-chip:active { transform:scale(.94); }
.tag-chip.active { background:var(--accent); color:#fff; border-color:var(--accent); }
.tag-chip.active::after { content:'×'; font-size:.65rem; margin-left:.15rem; opacity:.85; }
.tag-chip:focus-visible { outline:none; box-shadow:0 0 0 2px rgba(255,255,255,0.85), 0 0 0 5px var(--accent); }
@media (max-width:640px){
  .tags-section { padding:.55rem .55rem .6rem; }
  .tag-chip { font-size:.55rem; padding:.36rem .6rem .38rem; }
}

/* Extra links & screenshot */
.extra-links { display:flex; gap:.6rem; flex-wrap:wrap; }
.extra-links a { font-size:.65rem; text-decoration:none; padding:.35rem .55rem; border-radius:.5rem; background:var(--bg-tertiary); border:1px solid var(--border); color:var(--accent); font-weight:600; letter-spacing:.4px; }
.extra-links a:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
.screenshot-preview { margin-top:.5rem; border:1px solid var(--border); border-radius:.6rem; overflow:hidden; background:var(--bg-tertiary); position:relative; }
.screenshot-preview img { display:block; width:100%; height:auto; max-height:260px; object-fit:contain; background:#000; }
.screenshot-preview.load-error { display:none; }

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions { justify-content:flex-start; }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .news-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .news-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

/* Floating refresh button */
.floating-refresh { position:fixed; bottom:1.6rem; right:1.6rem; width:3.1rem; height:3.1rem; border-radius:50%; background:linear-gradient(135deg,var(--accent) 0%, var(--accent) 60%, var(--accent) 100%); color:#fff; font-size:1.35rem; font-weight:600; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.35),0 0 0 2px rgba(255,255,255,0.12),0 0 0 6px rgba(99,102,241,0.18); backdrop-filter:blur(4px) saturate(160%); transition:transform .2s ease, box-shadow .3s ease, filter .3s ease; z-index:950; }
.floating-refresh:hover:not(:disabled){ transform:translateY(-3px) scale(1.07); box-shadow:0 10px 26px rgba(0,0,0,0.5),0 0 0 2px rgba(255,255,255,0.2),0 0 0 8px rgba(99,102,241,0.25); filter:brightness(1.06); }
.floating-refresh:active:not(:disabled){ transform:scale(.9); }
.floating-refresh:disabled { opacity:.55; cursor:not-allowed; }
.floating-refresh:focus-visible { outline:none; box-shadow:0 0 0 3px rgba(255,255,255,0.9),0 0 0 6px var(--accent); }
@media (max-width:640px){ .floating-refresh { bottom:1.1rem; right:1.1rem; width:2.85rem; height:2.85rem; font-size:1.15rem; } }
.floating-refresh .spin { animation: fr-spin 1s linear infinite; display:inline-block; }
@keyframes fr-spin { 0%{ transform:rotate(0)} 100%{ transform:rotate(360deg)} }
</style>