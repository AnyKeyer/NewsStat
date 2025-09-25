import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

  return {
    all,
    add,
    remove,
    clearAll,
    suggestions,
    ingestReports
  }
})
