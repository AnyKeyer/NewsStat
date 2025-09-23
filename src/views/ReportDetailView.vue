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
            <span v-if="report.createdBy" class="meta-item">
              👤 {{ report.createdBy }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <router-link to="/" class="btn btn-secondary">← Назад</router-link>
        </div>
      </div>

      <!-- Статистика -->
      <div v-if="statistics" class="statistics-section">
        <h2>📊 Общая статистика</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ statistics.totalNews }}</div>
            <div class="stat-label">Всего новостей</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ statistics.workingNews }}</div>
            <div class="stat-label">Рабочих новостей</div>
          </div>
          <div class="stat-card positive">
            <div class="stat-number">+{{ statistics.averageGrowth.toFixed(2) }}%</div>
            <div class="stat-label">Средний рост</div>
            <div class="stat-count">({{ statistics.positiveNewsCount }} новостей)</div>
          </div>
          <div class="stat-card negative">
            <div class="stat-number">-{{ statistics.averageDecline.toFixed(2) }}%</div>
            <div class="stat-label">Средний спад</div>
            <div class="stat-count">({{ statistics.negativeNewsCount }} новостей)</div>
          </div>
        </div>
      </div>

      <!-- Список новостей -->
      <div class="news-section">
        <h2>📰 Новости в отчете ({{ report.news.length }})</h2>
        
        <div class="news-filters">
          <button 
            @click="newsFilter = 'all'"
            :class="['filter-btn', { active: newsFilter === 'all' }]"
          >
            Все ({{ report.news.length }})
          </button>
          <button 
            @click="newsFilter = 'positive'"
            :class="['filter-btn', 'positive', { active: newsFilter === 'positive' }]"
          >
            Рост ({{ report.news.filter(n => n.impact > 0).length }})
          </button>
          <button 
            @click="newsFilter = 'negative'"
            :class="['filter-btn', 'negative', { active: newsFilter === 'negative' }]"
          >
            Падение ({{ report.news.filter(n => n.impact < 0).length }})
          </button>
        </div>

        <div class="news-list">
          <div 
            v-for="newsItem in filteredNews" 
            :key="newsItem.id" 
            class="news-card"
          >
            <div class="news-header">
              <h3 class="news-title">{{ newsItem.title }}</h3>
              <div class="news-impact" :class="{ positive: newsItem.impact > 0, negative: newsItem.impact < 0 }">
                {{ newsItem.impact > 0 ? '+' : '' }}{{ newsItem.impact.toFixed(2) }}%
              </div>
            </div>
            
            <div class="news-token">
              <strong>Токен:</strong> {{ newsItem.tokenName }}
            </div>
            
            <div class="news-text">{{ newsItem.text }}</div>
            
            <div v-if="newsItem.comment" class="news-comment">
              <strong>Комментарий:</strong> {{ newsItem.comment }}
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
              <span class="news-date">{{ formatDate(newsItem.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useReportStore } from '@/stores/reports'
import metaService from '@/services/metaService'

interface Props {
  id: string
}

const props = defineProps<Props>()
const route = useRoute()
const reportStore = useReportStore()

const newsFilter = ref<'all' | 'positive' | 'negative'>('all')

const report = computed(() => reportStore.currentReport)
const statistics = computed(() => reportStore.reportStatistics)

const filteredNews = computed(() => {
  if (!report.value) return []
  
  switch (newsFilter.value) {
    case 'positive':
      return report.value.news.filter(news => news.impact > 0)
    case 'negative':
      return report.value.news.filter(news => news.impact < 0)
    default:
      return report.value.news
  }
})

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
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

.statistics-section h2 {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px var(--shadow);
  text-align: center;
  border-left: 4px solid var(--accent);
  border: 1px solid var(--border);
}

.stat-card.positive {
  border-left-color: var(--success);
}

.stat-card.negative {
  border-left-color: var(--danger);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-count {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.news-section h2 {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.news-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.filter-btn:hover {
  border-color: var(--accent);
}

.filter-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.filter-btn.positive.active {
  background: var(--success);
  border-color: var(--success);
}

.filter-btn.negative.active {
  background: var(--danger);
  border-color: var(--danger);
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.news-card {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px var(--shadow);
  border: 1px solid var(--border);
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.news-title {
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.news-impact {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: bold;
  font-size: 0.875rem;
  white-space: nowrap;
}

.news-impact.positive {
  background: rgba(16, 185, 129, 0.2);
  color: var(--success);
}

.news-impact.negative {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.news-token {
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 1rem;
}

.news-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.news-comment {
  color: var(--text-muted);
  font-style: italic;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.news-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.news-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
}

.news-link:hover {
  text-decoration: underline;
}

.news-date {
  color: var(--text-muted);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    align-items: stretch;
  }
  
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
</style>