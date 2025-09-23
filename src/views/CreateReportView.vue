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
                class="btn-remove"
                :disabled="loading"
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
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReportStore } from '@/stores/reports'
import type { Report, NewsItem } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const reportStore = useReportStore()

const loading = ref(false)
const error = ref<string | null>(null)

const reportForm = reactive({
  description: ''
})

const newsItems = ref<NewsItem[]>([])

const isFormValid = computed(() => {
  return (
    newsItems.value.length > 0 &&
    newsItems.value.every(news => 
      news.title.trim() &&
      news.text.trim() &&
      news.url.trim() &&
      news.tokenName.trim() &&
      news.impact !== 0
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
  
  newsItems.value.push({
    id: generateId(),
    title: '',
    text: '',
    url: '',
    tokenName: '',
    comment: '',
    impact: 0,
    date: new Date()
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
    const report: Report = {
      id: generateId(),
      title: generateReportTitle(),
      description: reportForm.description.trim() || undefined,
      news: newsItems.value.map(news => ({
        ...news,
        title: news.title.trim(),
        text: news.text.trim(),
        url: news.url.trim(),
        tokenName: news.tokenName.trim().toUpperCase(),
        comment: news.comment.trim()
      })),
      createdAt: new Date(),
      createdBy: authStore.user?.displayName || authStore.user?.username
    }

    await reportStore.saveReport(report)
    
    // Перенаправляем на главную страницу где можно увидеть новый отчет
    router.push({ name: 'Home' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'
  } finally {
    loading.value = false
  }
}

// Добавляем одну новость по умолчанию
addNews()
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

.btn-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
}

.btn-remove:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
</style>