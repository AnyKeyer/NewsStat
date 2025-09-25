<template>
  <div class="edit-report" v-if="loaded">
    <div class="create-header">
      <h1>✏️ Редактирование отчета</h1>
      <p>Измените данные и сохраните обновленную версию</p>
    </div>

    <form @submit.prevent="handleSubmit" class="report-form" v-if="reportForm">
      <div class="form-section">
        <h2>📋 Основная информация</h2>
        <div class="form-group">
          <label class="form-label">Название отчета</label>
          <input v-model="title" type="text" class="form-input" :disabled="loading" />
          <p class="form-hint">Вы можете изменить название вручную</p>
        </div>
        <div class="form-group">
          <label class="form-label">Описание отчета</label>
          <textarea v-model="reportForm.description" rows="3" class="form-input" :disabled="loading"></textarea>
        </div>
      </div>

      <div class="form-section">
        <div class="news-header">
          <h2>📰 Новости ({{ newsItems.length }}/100)</h2>
          <button type="button" class="btn btn-success" @click="addNews" :disabled="newsItems.length>=100 || loading">➕ Добавить новость</button>
        </div>

        <div v-if="!newsItems.length" class="empty-news">Новостей нет</div>

        <div class="news-list">
          <div v-for="(news, index) in newsItems" :key="news.id" class="news-item">
            <div class="news-item-header">
              <h3>Новость #{{ index+1 }}</h3>
              <button type="button" class="btn btn-danger-outline btn-sm btn-icon-only" @click="removeNews(index)" :disabled="loading" title="Удалить новость">❌</button>
            </div>
            <div class="news-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Заголовок *</label>
                  <input v-model="news.title" type="text" class="form-input" required :disabled="loading" />
                </div>
                <div class="form-group">
                  <label class="form-label">Токен *</label>
                  <input v-model="news.tokenName" type="text" class="form-input" required :disabled="loading" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Текст *</label>
                <textarea v-model="news.text" rows="3" class="form-input" required :disabled="loading"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ссылка *</label>
                  <input v-model="news.url" type="url" class="form-input" required :disabled="loading" />
                </div>
                <div class="form-group">
                  <label class="form-label">Влияние (%) *</label>
                  <input v-model.number="news.impact" type="number" step="0.01" class="form-input" required :disabled="loading" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Комментарий</label>
                <textarea v-model="news.comment" rows="2" class="form-input" :disabled="loading"></textarea>
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
                <p class="form-hint">Короткие ключевые слова без #. Примеры: macro, sec, hack, listing, regulation.</p>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ссылка на страницу токена</label>
                  <input v-model="news.tokenUrl" type="url" class="form-input" :disabled="loading" placeholder="https://www.bybit.com/... или https://www.coingecko.com/..." />
                  <p class="form-hint">Опционально: Bybit / CoinGecko / DexScreener / TradingView — для быстрого перехода к информации по активу.</p>
                </div>
                <div class="form-group">
                  <label class="form-label">Ссылка на скрин</label>
                  <input v-model="news.screenshotUrl" type="url" class="form-input" :disabled="loading" placeholder="https://i.imgur.com/xxxx.png или https://files.catbox.moe/..." />
                  <p class="form-hint">Можно любую ссылку. Прямая на файл (.png/.jpg/.webp) — появится мини-превью. Если это просто страница — ссылка сохранится, но без мини-картинки. Для гарантии превью: прямые CDN или <a href="https://catbox.moe/" target="_blank" rel="noopener">catbox.moe</a>.</p>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Время появления *</label>
                  <input v-model="news.dateLocal" type="datetime-local" class="form-input" required :disabled="loading" />
                  <p class="form-hint">Сохраняется UTC, показывается локально</p>
                </div>
                <div class="form-group">
                  <label class="form-label">Цена сдвинулась?</label>
                  <div class="pm-toggle">
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
                  <p class="form-hint">Отметьте если движение цены подтвердилось</p>
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
                  <p class="form-hint">Требуются специальные инструменты/софт</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="!isFormValid || loading">{{ loading ? 'Сохранение...' : '💾 Обновить отчет' }}</button>
        <router-link :to="{ name: 'ReportDetail', params: { id: reportId } }" class="btn btn-secondary">Отмена</router-link>
      </div>
    </form>

    <div v-if="error" class="error-message">
      <h3>❌ Ошибка</h3>
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="error=null">Закрыть</button>
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

    <!-- Floating Save (Update) Button -->
    <button
      type="button"
      class="floating-save-report"
      @click="handleSubmit"
      :disabled="!isFormValid || loading"
      :title="!isFormValid ? 'Форма неполная' : 'Сохранить изменения'"
      aria-label="Сохранить отчет"
    >
      <span v-if="!loading">💾</span>
      <span v-else class="mini-spinner" aria-hidden="true"></span>
    </button>
  </div>
  <div v-else class="loading-state"><div class="loading-spinner"></div><p>Загрузка...</p></div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reports'
import { useHashtagStore } from '@/stores/hashtags'
import type { Report, NewsItem } from '@/types'
import HashtagInput from '@/components/HashtagInput.vue'

interface LocalNewsItem extends NewsItem { dateLocal: string; hashtags: string[] }

const route = useRoute()
const router = useRouter()
const reportStore = useReportStore()
const hashtagStore = useHashtagStore()
const reportId = route.params.id as string

const loading = ref(false)
const error = ref<string|null>(null)
const loaded = ref(false)
const title = ref('')
const reportForm = reactive({ description: '' })
const newsItems = ref<LocalNewsItem[]>([])
const hashtagComponents = ref<any[]>([])
function setHashtagRef(index:number){ return (el:any)=> { hashtagComponents.value[index] = el } }

function toLocalInputValue(d: Date): string {
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const da = String(d.getDate()).padStart(2,'0'); const h = String(d.getHours()).padStart(2,'0'); const mi = String(d.getMinutes()).padStart(2,'0');
  return `${y}-${m}-${da}T${h}:${mi}`
}

function generateId(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

function addNews() {
  newsItems.value.push({ id: generateId(), title:'', text:'', url:'', tokenName:'', tokenUrl:'', screenshotUrl:'', comment:'', impact:0, date:new Date(), priceMoved: undefined, needsSoftware: undefined, dateLocal: toLocalInputValue(new Date()), hashtags: [] })
}
function removeNews(i:number){ newsItems.value.splice(i,1) }

const isFormValid = computed(()=> newsItems.value.length>0 && newsItems.value.every(n=> n.title.trim() && n.text.trim() && n.url.trim() && n.tokenName.trim() && n.impact !== 0 && n.dateLocal ))

async function load() {
  loading.value = true
  try {
    if (!reportStore.currentReport || reportStore.currentReport.id !== reportId) {
      await reportStore.loadReport(reportId)
    }
    const rep = reportStore.currentReport
    if (!rep) throw new Error('Отчет не найден')
    title.value = rep.title
    reportForm.description = rep.description || ''
  newsItems.value = rep.news.map(n => ({ ...n, dateLocal: toLocalInputValue(new Date(n.date)), needsSoftware: n.needsSoftware, hashtags: (n.hashtags||[]).map(h=>h.toLowerCase()) }))
  // Инжектим в глобальный стор
  hashtagStore.add(rep.news.flatMap(n => n.hashtags || []))
    loaded.value = true
  } catch(e:any) {
    error.value = e.message || 'Ошибка загрузки'
  } finally { loading.value = false }
}

async function handleSubmit() {
  if (!isFormValid.value) return
  loading.value = true
  error.value = null
  try {
    const existing = reportStore.currentReport
    if (!existing) throw new Error('Отчет не загружен')
    const updated: Report = {
      ...existing,
      title: title.value.trim() || existing.title,
      description: reportForm.description.trim() || undefined,
      // Перед маппингом коммитим драфты
      // (если пользователь сразу нажал "Сохранить" не подтвердив последний ввод)
      ...(hashtagComponents.value.forEach(c => { try { c?.commit?.() } catch(_) {} }), {}),
      news: newsItems.value.map(n => ({
        id: n.id,
        title: n.title.trim(),
        text: n.text.trim(),
        url: n.url.trim(),
        tokenName: n.tokenName.trim().toUpperCase(),
        tokenUrl: n.tokenUrl?.trim() || undefined,
        screenshotUrl: n.screenshotUrl?.trim() || undefined,
        comment: n.comment.trim(),
        impact: n.impact,
        date: new Date(n.dateLocal),
        priceMoved: n.priceMoved,
        needsSoftware: n.needsSoftware,
        hashtags: (n.hashtags||[]).map(h => h.toLowerCase())
      })),
      hashtagsCache: Array.from(new Set(newsItems.value.flatMap(n => n.hashtags || []).map(h => h.toLowerCase()))).sort()
      // createdAt и createdBy не меняем
    }
    await reportStore.updateReport(updated)
    hashtagStore.add(updated.hashtagsCache || [])
    router.push({ name: 'ReportDetail', params: { id: updated.id } })
  } catch(e:any) {
    error.value = e.message || 'Не удалось обновить'
  } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
/* Общие стили формы (скопированы из CreateReportView для устранения ошибочного импорта .vue) */
.create-header { text-align:center; margin-bottom:3rem; }
.create-header h1 { color: var(--text-primary); margin-bottom:0.5rem; }
.create-header p { color: var(--text-secondary); }

.report-form { max-width:800px; margin:0 auto; }
.form-section { background:var(--bg-secondary); padding:2rem; border-radius:0.75rem; box-shadow:0 2px 4px var(--shadow); border:1px solid var(--border); margin-bottom:2rem; }
.form-section h2 { color:var(--text-primary); margin-bottom:1.5rem; padding-bottom:0.5rem; border-bottom:2px solid var(--border); }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.news-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
.empty-news { text-align:center; padding:2rem; color:var(--text-muted); background:var(--bg-tertiary); border-radius:0.5rem; border:2px dashed var(--border); }
.news-list { display:flex; flex-direction:column; gap:2rem; }
.news-item { border:1px solid var(--border); border-radius:0.75rem; padding:1.5rem; background:var(--bg-tertiary); }
.news-item-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; padding-bottom:0.5rem; border-bottom:1px solid var(--border); }
.news-item-header h3 { color:var(--text-primary); margin:0; }
.news-form { display:flex; flex-direction:column; gap:1rem; }
.form-actions { display:flex; justify-content:center; gap:1rem; margin-top:2rem; }
.error-message { position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--bg-secondary); padding:2rem; border-radius:0.75rem; box-shadow:0 10px 25px rgba(0,0,0,0.5); border:1px solid var(--danger); text-align:center; z-index:1000; max-width:400px; width:90%; }
.error-message::before { content:''; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:-1; }
.error-message h3 { color:var(--danger); margin-bottom:1rem; }
.auto-title { padding:0.75rem; background:var(--secondary-bg); border:2px solid var(--border); border-radius:0.5rem; font-weight:500; color:var(--primary); font-size:1rem; }
.form-hint { font-size:0.875rem; color:var(--text-secondary); margin-top:0.5rem; margin-bottom:0; }

/* Floating Button */
.floating-add-news { position:fixed; bottom:2rem; right:2rem; width:3.5rem; height:3.5rem; border-radius:50%; background:linear-gradient(135deg,var(--primary) 0%, var(--primary-accent,#6366f1) 60%, var(--primary) 100%); color:#fff; font-size:1.6rem; font-weight:600; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.35),0 0 0 2px rgba(255,255,255,0.14),0 0 0 6px rgba(99,102,241,0.15); backdrop-filter:blur(4px) saturate(160%); transition:transform .2s ease, box-shadow .3s ease, filter .3s ease; z-index:900; }
.floating-add-news:hover:not(:disabled){ transform:translateY(-3px) scale(1.08); box-shadow:0 10px 26px rgba(0,0,0,0.55),0 0 0 2px rgba(255,255,255,0.25),0 0 0 8px rgba(99,102,241,0.25); filter:brightness(1.08); }
.floating-add-news:active:not(:disabled){ transform:scale(0.92); }
.floating-add-news:disabled { opacity:.55; cursor:not-allowed; }
.floating-add-news:focus-visible { outline:none; box-shadow:0 0 0 3px rgba(255,255,255,0.9),0 0 0 6px var(--primary); }

/* Floating Save Button */
.floating-save-report { position:fixed; bottom:6.2rem; right:2rem; width:3.5rem; height:3.5rem; border-radius:50%; background:linear-gradient(145deg,var(--accent,#10b981) 0%, var(--accent,#10b981) 70%, var(--accent,#059669) 100%); color:#fff; font-size:1.55rem; font-weight:600; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.35),0 0 0 2px rgba(255,255,255,0.14),0 0 0 6px rgba(16,185,129,0.18); backdrop-filter:blur(5px) saturate(170%); transition:transform .22s ease, box-shadow .28s ease, filter .28s ease; z-index:901; }
.floating-save-report:hover:not(:disabled){ transform:translateY(-3px) scale(1.07); box-shadow:0 10px 28px rgba(0,0,0,0.55),0 0 0 2px rgba(255,255,255,0.25),0 0 0 8px rgba(16,185,129,0.28); filter:brightness(1.1); }
.floating-save-report:active:not(:disabled){ transform:scale(.9); }
.floating-save-report:disabled { opacity:.5; cursor:not-allowed; filter:grayscale(.3); }
.floating-save-report:focus-visible { outline:none; box-shadow:0 0 0 3px rgba(255,255,255,0.92),0 0 0 6px rgba(16,185,129,0.9); }

.mini-spinner { width:1.45rem; height:1.45rem; border:3px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; animation:spin .85s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.pm-toggle { display:flex; gap:.45rem; }
/* Отключены переходы для кнопок в toggle-группах */
.pm-toggle .btn { 
  transition: none !important; 
  box-shadow: none !important; 
}
.pm-toggle .btn:before { display:none !important; }
.pm-toggle .btn:hover { filter:none; }
.pm-toggle .btn:active { transform:none; }

@media (max-width:640px){
  .floating-add-news { bottom:1.1rem; right:1.1rem; width:3.25rem; height:3.25rem; font-size:1.4rem; }
  .floating-save-report { bottom:5.55rem; right:1.1rem; width:3.25rem; height:3.25rem; font-size:1.4rem; }
}
@media (max-width:768px){
  .form-row { grid-template-columns:1fr; }
  .news-header { flex-direction:column; gap:1rem; align-items:stretch; }
  .form-actions { flex-direction:column; }
  .report-form { margin:0; }
  .form-section { padding:1.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  .floating-add-news, .floating-add-news:hover:not(:disabled) { transition:none; transform:none !important; }
}
</style>
