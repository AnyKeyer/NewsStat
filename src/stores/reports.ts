import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHashtagStore } from '@/stores/hashtags'
import type { Report, ReportStatistics } from '@/types'
import r2Service from '@/services/r2Service'
import { mockService } from '@/services/mockService'

export const useReportStore = defineStore('reports', () => {
  const hashtagStore = useHashtagStore()
  const reports = ref<Array<{ id: string; title: string; createdAt: Date }>>([])
  const currentReport = ref<Report | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const reportStatistics = computed((): ReportStatistics | null => {
    if (!currentReport.value) return null

    const news = currentReport.value.news
    const totalNews = news.length
    const workingNews = totalNews // все новости считаются рабочими

    const positiveNews = news.filter(n => n.impact > 0)
    const negativeNews = news.filter(n => n.impact < 0)

    const averageGrowth = positiveNews.length > 0
      ? positiveNews.reduce((sum, n) => sum + n.impact, 0) / positiveNews.length
      : 0

    const averageDecline = negativeNews.length > 0
      ? Math.abs(negativeNews.reduce((sum, n) => sum + n.impact, 0) / negativeNews.length)
      : 0

    // Movement metrics
    let movedCount = 0
    let staticCount = 0
    let unmarkedCount = 0
    for (const n of news) {
      if (n.priceMoved === true) movedCount++
      else if (n.priceMoved === false) staticCount++
      else unmarkedCount++
    }
    const movedPercent = totalNews === 0 ? 0 : (movedCount / totalNews) * 100

    return {
      totalNews,
      workingNews,
      averageGrowth,
      averageDecline,
      positiveNewsCount: positiveNews.length,
      negativeNewsCount: negativeNews.length,
      movedCount,
      staticCount,
      unmarkedCount,
      movedPercent
    }
  })

  async function loadReports() {
    loading.value = true
    error.value = null
    
    try {
      console.log('Загружаем список отчетов из R2...')
      reports.value = await r2Service.listReports()
      console.log(`Загружено отчетов: ${reports.value.length}`)
    } catch (err) {
      error.value = 'Не удалось загрузить список отчетов'
      console.error('Ошибка загрузки отчетов:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadReport(reportId: string) {
    loading.value = true
    error.value = null
    
    try {
      console.log(`Загружаем отчет ${reportId} из R2...`)
      const report = await r2Service.getReport(reportId)
      
      if (report) {
        currentReport.value = report
        console.log(`Отчет ${reportId} успешно загружен`)
        // Синхронизируем хэштеги (локально и удаленно — без force merge, только локальный апдейт + фоновая синхронизация)
        if (report.hashtagsCache && report.hashtagsCache.length) {
          hashtagStore.add(report.hashtagsCache)
          // не обязательно ждать, запускаем попытку мерджа
          hashtagStore.mergeRemote(report.hashtagsCache)
        }
      } else {
        error.value = 'Отчет не найден'
      }
    } catch (err) {
      error.value = 'Не удалось загрузить отчет'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function saveReport(report: Report) {
    loading.value = true
    error.value = null
    
    try {
      console.log('Сохраняем отчет в R2...')
      await r2Service.uploadReport(report)
  // Индексируем URL новостей
  try { await r2Service.indexReportNews(report) } catch (e) { console.warn('Не удалось обновить индекс URL новостей', e) }
      
      // Добавляем отчет в локальный список
      const reportSummary = {
        id: report.id,
        title: report.title,
        createdAt: report.createdAt
      }
      
      reports.value.unshift(reportSummary)
      currentReport.value = report
      console.log('Отчет успешно сохранен и добавлен в список')
      if (report.hashtagsCache && report.hashtagsCache.length) {
        hashtagStore.add(report.hashtagsCache)
        hashtagStore.mergeRemote(report.hashtagsCache)
      }
    } catch (err) {
      error.value = 'Не удалось сохранить отчет'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateReport(updated: Report) {
    loading.value = true
    error.value = null
    try {
      updated.updatedAt = new Date()
      console.log(`Обновляем отчет ${updated.id} в R2...`)
      await r2Service.uploadReport(updated)
      try { await r2Service.indexReportNews(updated) } catch (e) { console.warn('Не удалось обновить индекс URL новостей', e) }
      // Обновляем в списке (если есть)
      const idx = reports.value.findIndex(r => r.id === updated.id)
      if (idx !== -1) {
        reports.value[idx] = { id: updated.id, title: updated.title, createdAt: updated.createdAt }
      } else {
        // если отчета не было в списке (редкий случай) добавим
        reports.value.unshift({ id: updated.id, title: updated.title, createdAt: updated.createdAt })
      }
      currentReport.value = updated
      console.log(`Отчет ${updated.id} обновлен`)
      if (updated.hashtagsCache && updated.hashtagsCache.length) {
        hashtagStore.add(updated.hashtagsCache)
        hashtagStore.mergeRemote(updated.hashtagsCache)
      }
    } catch (err) {
      error.value = 'Не удалось обновить отчет'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteReport(reportId: string) {
    loading.value = true
    error.value = null
    
    try {
      console.log(`Удаляем отчет ${reportId} из R2...`)
      await r2Service.deleteReport(reportId)
  try { await r2Service.removeReportFromUrlIndex(reportId) } catch (e) { console.warn('Не удалось обновить индекс URL при удалении', e) }
      
      // Удаляем из локального списка
      reports.value = reports.value.filter(r => r.id !== reportId)
      
      // Если это текущий отчет, очищаем его
      if (currentReport.value?.id === reportId) {
        currentReport.value = null
      }
      
      console.log(`Отчет ${reportId} успешно удален`)
    } catch (err) {
      error.value = 'Не удалось удалить отчет'
      console.error('Ошибка удаления отчета:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearCurrentReport() {
    currentReport.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    reports,
    currentReport,
    loading,
    error,
    reportStatistics,
    loadReports,
    loadReport,
    saveReport,
  updateReport,
    deleteReport,
    clearCurrentReport,
    clearError
  }
})