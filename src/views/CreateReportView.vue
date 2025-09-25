<template>
  <div class="create-report">
    <div class="create-header">
      <h1>➕ Создание нового отчета</h1>
      <p>Создайте отчет анализа влияния новостей на криптовалютные токены</p>
    </div>

    <form @submit.prevent="handleSubmit" class="report-form">
      <!-- Основная информация отчета -->
      <div class="form-section">
        <h2>📋 Основная информация</h2>
        
        <div class="form-group">
          <label class="form-label">📅 Название отчета</label>
          <div class="auto-title">
            {{ generateReportTitle() }}
          </div>
          <p class="form-hint">Название автоматически генерируется на основе даты и времени создания</p>
        </div>
        
        <div class="form-group">
          <label for="description" class="form-label">Описание отчета</label>
          <textarea
            id="description"
            v-model="reportForm.description"
            class="form-input"
            rows="3"
            placeholder="Краткое описание отчета (опционально)"
            :disabled="loading"
          ></textarea>
        </div>
      </div>

      <!-- Новости -->
      <div class="form-section">
        <div class="news-header">
          <h2>📰 Новости ({{ newsItems.length }}/100)</h2>
          <button
            type="button"
            @click="addNews"
            class="btn btn-success"
            :disabled="newsItems.length >= 100 || loading"
          >
            ➕ Добавить новость
          </button>
        </div>

        <div v-if="newsItems.length === 0" class="empty-news">
          <p>Добавьте хотя бы одну новость для создания отчета</p>
        </div>

        <div class="news-list">
          <div
            v-for="(news, index) in newsItems"
            :key="news.id"
            class="news-item"
          >
            <div class="news-item-header">
              <h3>Новость #{{ index + 1 }}</h3>
              <button
                type="button"
                @click="removeNews(index)"
                class="btn btn-danger-outline btn-sm btn-icon-only"
                :disabled="loading"
                title="Удалить новость"
              >
                ❌
              </button>
            </div>

            <div class="news-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Заголовок новости *</label>
                  <input
                    v-model="news.title"
                    type="text"
                    class="form-input"
                    placeholder="Заголовок новости"
                    required
                    :disabled="loading"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Токен *</label>
                  <input
                    v-model="news.tokenName"
                    type="text"
                    class="form-input"
                    placeholder="Например: BTC, ETH, DOGE"
                    required
                    :disabled="loading"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Текст новости *</label>
                <textarea
                  v-model="news.text"
                  class="form-input"
                  rows="3"
                  placeholder="Содержание новости"
                  required
                  :disabled="loading"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ссылка на страницу токена</label>
                  <input
                    v-model="news.tokenUrl"
                    type="url"
                    class="form-input"
                    placeholder="https://www.bybit.com/... или https://www.coingecko.com/..."
                    :disabled="loading"
                  />
                  <p class="form-hint">Опционально: страница токена (Bybit, CoinGecko, DexScreener, TradingView). Укажи чтобы быстрее перейти к стакану.</p>
                </div>
                <div class="form-group">
                  <label class="form-label">Ссылка на скрин</label>
                  <input
                    v-model="news.screenshotUrl"
                    type="url"
                    class="form-input"
                    placeholder="https://i.imgur.com/xxxx.png или https://files.catbox.moe/..."
                    :disabled="loading"
                  />
                  <p class="form-hint">Можно вставить любую ссылку. Если это прямая на файл (.png/.jpg/.webp) — покажем мини-превью. Если обычная страница (без расширения) — всё равно сохранится, просто без мини-картинки. Для надежного превью подойдут прямые CDN или <a href="https://catbox.moe/" target="_blank" rel="noopener">catbox.moe</a>.</p>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ссылка на новость *</label>
                  <input
                    v-model="news.url"
                    type="url"
                    class="form-input"
                    placeholder="https://example.com/news"
                    required
                    :disabled="loading"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Влияние на токен (%) *</label>
                  <input
                    v-model.number="news.impact"
                    type="number"
                    step="0.01"
                    class="form-input"
                    placeholder="Например: +5.2 или -3.8"
                    required
                    :disabled="loading"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Комментарий</label>
                <textarea
                  v-model="news.comment"
                  class="form-input"
                  rows="2"
                  placeholder="Ваш комментарий к новости (опционально)"
                  :disabled="loading"
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Хэштеги</label>
                <HashtagInput
                  ref="setHashtagRef(index)"
                  v-model="news.hashtags"
                  :all="hashtagStore.all"
                  placeholder="Добавьте хэштег и нажмите Enter (пример: trend, etf, regulation)"
                  @added="(t)=>hashtagStore.add(t)"
                />
                <p class="form-hint">Используйте короткие тематические теги. Хранится без символа #. Примеры: etf, sec, pump, dump, macro, defi.</p>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Время появления (локальное)*</label>
                  <input
                    v-model="news.dateLocal"
                    type="datetime-local"
                    class="form-input"
                    required
                    :disabled="loading"
                  />
                  <p class="form-hint">Сохраняется в UTC, отображается в локальной зоне зрителя</p>
                </div>
                <div class="form-group">
                  <label class="form-label">Цена сдвинулась?</label>
                  <div class="pm-toggle">
                    <!-- Когда активен вариант, не используем outline чтобы не перебивались CSS-переменные -->
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="news.priceMoved === true ? 'btn-success' : 'btn-outline'"
                      @click="news.priceMoved = true"
                      :disabled="loading"
                    >Да</button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="news.priceMoved === false ? 'btn-danger' : 'btn-outline'"
                      @click="news.priceMoved = false"
                      :disabled="loading"
                    >Нет</button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="news.priceMoved == null ? 'btn-gradient' : 'btn-outline'"
                      @click="news.priceMoved = undefined"
                      :disabled="loading"
                      title="Сброс"
                    >—</button>
                  </div>
                  <p class="form-hint">Отметьте, если после новости цена реально дернулась в прогнозируемом направлении</p>
                </div>
                <div class="form-group">
                  <label class="form-label">Без софта не взять?</label>
                  <div class="pm-toggle">
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="news.needsSoftware === true ? 'btn-success' : 'btn-outline'"
                      @click="news.needsSoftware = true"
                      :disabled="loading"
                    >Да</button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="news.needsSoftware === false ? 'btn-primary' : 'btn-outline'"
                      @click="news.needsSoftware = false"
                      :disabled="loading"
                    >Можно</button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="news.needsSoftware == null ? 'btn-gradient' : 'btn-outline'"
                      @click="news.needsSoftware = undefined"
                      :disabled="loading"
                      title="Сброс"
                    >—</button>
                  </div>
                  <p class="form-hint">Отметьте, если реализация требует спец. инструментов/софта</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Действия -->
      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid || loading"
        >
          {{ loading ? 'Сохранение...' : '💾 Сохранить отчет' }}
        </button>
        <router-link to="/" class="btn btn-secondary">
          Отмена
        </router-link>
      </div>
    </form>

    <!-- Ошибка -->
    <div v-if="error" class="error-message">
      <h3>❌ Ошибка создания отчета</h3>
      <p>{{ error }}</p>
      <button @click="error = null" class="btn btn-secondary">Закрыть</button>
    </div>
    <!-- Floating Add News Button -->
    <button
      type="button"
      class="floating-add-news"
      @click="addNews"
      :disabled="newsItems.length >= 100 || loading"
      title="Добавить новость"
      aria-label="Добавить новость"
    >➕</button>
  </div>
</template>
<!-- Floating Add News button inserted inside root container above -->

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useToastStore } from '@/stores/toasts'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReportStore } from '@/stores/reports'
import { useHashtagStore } from '@/stores/hashtags'
import type { Report, NewsItem } from '@/types'
import HashtagInput from '@/components/HashtagInput.vue'

// Локальный тип с дополнительным полем dateLocal (строка для input datetime-local)
type LocalNewsItem = NewsItem & { dateLocal: string; hashtags: string[] }

const router = useRouter()
const authStore = useAuthStore()
const reportStore = useReportStore()
const toast = useToastStore()
const hashtagStore = useHashtagStore()

const loading = ref(false)
const error = ref<string | null>(null)

const reportForm = reactive({
  description: ''
})

const newsItems = ref<LocalNewsItem[]>([])
// refs на компоненты хэштегов
const hashtagComponents = ref<any[]>([])
function setHashtagRef(index: number) {
  return (el: any) => { hashtagComponents.value[index] = el }
}

const isFormValid = computed(() => {
  return (
    newsItems.value.length > 0 &&
    newsItems.value.every(news => 
      news.title.trim() &&
      news.text.trim() &&
      news.url.trim() &&
      news.tokenName.trim() &&
      news.impact !== 0 &&
      news.dateLocal
    )
  )
})

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function generateReportTitle(): string {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  
  return `Отчет от ${day}.${month}.${year} в ${hours}:${minutes}`
}

function addNews(): void {
  if (newsItems.value.length >= 100) return
  const now = new Date()
  newsItems.value.push({
    id: generateId(),
    title: '',
    text: '',
    url: '',
    tokenName: '',
    tokenUrl: '',
    screenshotUrl: '',
    comment: '',
    impact: 0,
    date: now,
    priceMoved: undefined,
    needsSoftware: undefined,
    dateLocal: toLocalInputValue(now),
    hashtags: []
  })
}

function removeNews(index: number): void {
  newsItems.value.splice(index, 1)
}

async function handleSubmit(): Promise<void> {
  if (!isFormValid.value) return
  
  loading.value = true
  error.value = null

  try {
    // Принудительно коммитим несохраненный draft во всех компонентах хэштегов (если пользователь не нажал Enter)
    hashtagComponents.value.forEach(c => { try { c?.commit?.() } catch(_) {} })
    const report: Report = {
      id: generateId(),
      title: generateReportTitle(),
      description: reportForm.description.trim() || undefined,
      news: newsItems.value.map(n => {
        // Преобразуем локальное значение (без TZ) в Date (будет интерпретировано как локальное) и храним как UTC ISO
        const date = n.dateLocal ? new Date(n.dateLocal) : new Date()
        return {
          id: n.id,
            title: n.title.trim(),
            text: n.text.trim(),
            url: n.url.trim(),
            tokenName: n.tokenName.trim().toUpperCase(),
            tokenUrl: n.tokenUrl?.trim() || undefined,
            screenshotUrl: n.screenshotUrl?.trim() || undefined,
            comment: n.comment.trim(),
            impact: n.impact,
            date,
            priceMoved: n.priceMoved,
            needsSoftware: n.needsSoftware,
            hashtags: n.hashtags?.map(h => h.trim().toLowerCase()).filter(Boolean) || []
        }
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: authStore.user?.displayName || authStore.user?.username,
      hashtagsCache: Array.from(new Set(newsItems.value.flatMap(n => n.hashtags || []).map(h => h.toLowerCase()))).sort()
    }

  await reportStore.saveReport(report)
  toast.success('Отчет успешно создан')
    hashtagStore.add(report.hashtagsCache || [])
    
    // Перенаправляем на главную страницу где можно увидеть новый отчет
    router.push({ name: 'Home' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Неизвестная ошибка'
    error.value = msg
    toast.error('Ошибка создания: ' + msg)
  } finally {
    loading.value = false
  }
}

// Добавляем одну новость по умолчанию
addNews()

function toLocalInputValue(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
</script>

<style scoped>
.create-header {
  text-align: center;
  margin-bottom: 3rem;
}

.create-header h1 {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.create-header p {
  color: var(--text-secondary);
}

.report-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px var(--shadow);
  border: 1px solid var(--border);
  margin-bottom: 2rem;
}

.form-section h2 {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.empty-news {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  border: 2px dashed var(--border);
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.news-item {
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
}

.news-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.news-item-header h3 {
  color: var(--text-primary);
  margin: 0;
}


.news-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.error-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--danger);
  text-align: center;
  z-index: 1000;
  max-width: 400px;
  width: 90%;
}

.error-message::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: -1;
}

.error-message h3 {
  color: var(--danger);
  margin-bottom: 1rem;
}

.auto-title {
  padding: 0.75rem;
  background: var(--secondary-bg);
  border: 2px solid var(--border);
  border-radius: 0.5rem;
  font-weight: 500;
  color: var(--primary);
  font-size: 1rem;
}

.form-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  margin-bottom: 0;
}

/* Floating Add News Button */
.floating-add-news {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-accent, #6366f1) 60%, var(--primary) 100%);
  color: #fff;
  font-size: 1.6rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.14), 0 0 0 6px rgba(99,102,241,0.15);
  backdrop-filter: blur(4px) saturate(160%);
  transition: transform 0.2s ease, box-shadow 0.3s ease, filter 0.3s ease;
  z-index: 900;
}

.floating-add-news:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 10px 26px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.25), 0 0 0 8px rgba(99,102,241,0.25);
  filter: brightness(1.08);
}

.floating-add-news:active:not(:disabled) {
  transform: scale(0.92);
}

.floating-add-news:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.floating-add-news:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.9), 0 0 0 6px var(--primary); 
}

@media (max-width: 640px) {
  .floating-add-news {
    bottom: 1.25rem;
    right: 1.25rem;
    width: 3.25rem;
    height: 3.25rem;
    font-size: 1.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-add-news, .floating-add-news:hover:not(:disabled) {
    transition: none;
    transform: none !important;
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .news-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .report-form {
    margin: 0;
  }
  
  .form-section {
    padding: 1.5rem;
  }
}

.pm-toggle { display:flex; gap:.45rem; }
/* Убираем анимации/плавности внутри группы переключателей, чтобы отклик был мгновенный */
.pm-toggle .btn { 
  transition: none !important; 
  box-shadow: none !important; 
}
.pm-toggle .btn:before { display:none !important; }
.pm-toggle .btn:hover { filter:none; }
.pm-toggle .btn:active { transform:none; }
</style>