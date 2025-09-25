import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import r2Service from '@/services/r2Service'
import type { Report } from '@/types'

// Простая нормализация: приводим к нижнему регистру, убираем ведущий # и пробелы
function normalize(tag: string): string {
  return tag
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
}

export const useHashtagStore = defineStore('hashtags', () => {
  const tags = ref<Set<string>>(new Set())
  const loaded = ref(false)

  const all = computed(() => Array.from(tags.value).sort())

  function ensureLoadedFromLocalStorage() {
    if (loaded.value) return
    try {
      const raw = localStorage.getItem('news-analysis-hashtags')
      if (raw) {
        const arr: string[] = JSON.parse(raw)
        arr.forEach(t => tags.value.add(normalize(t)))
      }
    } catch (e) {
      console.warn('Не удалось загрузить хэштеги из localStorage', e)
    } finally {
      loaded.value = true
    }
  }

  function persist() {
    try {
      localStorage.setItem('news-analysis-hashtags', JSON.stringify(all.value))
    } catch (e) {
      console.warn('Не удалось сохранить хэштеги', e)
    }
  }

  function add(raw: string | string[]) {
    ensureLoadedFromLocalStorage()
    const arr = Array.isArray(raw) ? raw : [raw]
    let changed = false
    for (const t of arr) {
      const n = normalize(t)
      if (!n) continue
      if (!tags.value.has(n)) {
        tags.value.add(n)
        changed = true
      }
    }
    if (changed) persist()
  }

  function remove(raw: string) {
    ensureLoadedFromLocalStorage()
    const n = normalize(raw)
    if (tags.value.delete(n)) persist()
  }

  function clearAll() {
    tags.value.clear()
    persist()
  }

  function suggestions(prefix: string, limit = 10): string[] {
    ensureLoadedFromLocalStorage()
    const p = normalize(prefix)
    if (!p) return all.value.slice(0, limit)
    return all.value.filter(t => t.startsWith(p)).slice(0, limit)
  }

  // Обновляем из набора отчетов (например при первоначальной загрузке)
  function ingestReports(reports: Report[]) {
    let changed = false
    for (const r of reports) {
      for (const n of r.news) {
        if (n.hashtags) {
          for (const ht of n.hashtags) {
            const norm = normalize(ht)
            if (norm && !tags.value.has(norm)) {
              tags.value.add(norm)
              changed = true
            }
          }
        }
      }
    }
    if (changed) persist()
  }

  // ===== Remote Sync (R2) =====
  const remoteLoaded = ref(false)
  const lastRemoteSync = ref<Date | null>(null)
  const syncing = ref(false)

  async function syncFromRemote(force = false) {
    ensureLoadedFromLocalStorage()
    if (syncing.value) return
    if (!force && remoteLoaded.value && lastRemoteSync.value && Date.now() - lastRemoteSync.value.getTime() < 60_000) {
      return // не чаще раза в минуту без force
    }
    syncing.value = true
    try {
      const idx = await r2Service.getHashtagIndex()
      if (idx && Array.isArray(idx.tags)) {
        let changed = false
        for (const t of idx.tags) {
          const n = normalize(t)
          if (n && !tags.value.has(n)) { tags.value.add(n); changed = true }
        }
        if (changed) persist()
        remoteLoaded.value = true
        lastRemoteSync.value = new Date()
      }
    } finally {
      syncing.value = false
    }
  }

  async function mergeRemote(incoming: string[]) {
    ensureLoadedFromLocalStorage()
    if (!incoming.length) return
    // локально добавим сразу
    add(incoming)
    try {
      await r2Service.mergeHashtags(incoming)
      lastRemoteSync.value = new Date()
    } catch (e) {
      console.warn('Не удалось слить хэштеги на сервер, останутся локально до следующей попытки', e)
    }
  }

  // Полная пересборка (например аварийная) — принимает список отчетов
  async function rebuildFromReports(reports: Report[]) {
    tags.value.clear()
    ingestReports(reports)
    persist()
    try {
      await r2Service.putHashtagIndex(all.value)
      lastRemoteSync.value = new Date()
    } catch (e) {
      console.error('Не удалось выгрузить полный индекс хэштегов', e)
    }
  }

  return {
    all,
    add,
    remove,
    clearAll,
    suggestions,
    ingestReports,
    syncFromRemote,
    mergeRemote,
    rebuildFromReports,
    syncing,
    lastRemoteSync
  }
})

// Dev helper (не ломает prod, просто навешивает глобал при наличии window)
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__rebuildHashtags = async (reports: Report[]) => {
    const store = useHashtagStore()
    await store.rebuildFromReports(reports)
    return store.all
  }
}
