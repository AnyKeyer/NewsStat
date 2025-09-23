import type { Report, ReportStatistics } from '@/types'

interface MetaData {
  title: string
  description: string
  url: string
}

class MetaService {
  
  updatePageMeta(data: MetaData): void {
    // Обновляем title страницы
    document.title = data.title
    
    // Обновляем или создаем мета-теги
    this.updateMetaTag('description', data.description)
    this.updateMetaTag('og:title', data.title)
    this.updateMetaTag('og:description', data.description)
    this.updateMetaTag('og:url', data.url)
    this.updateMetaTag('twitter:title', data.title)
    this.updateMetaTag('twitter:description', data.description)
  }

  updateReportMeta(report: Report, statistics: ReportStatistics): void {
    const title = `📊 ${report.title} | News Analysis`
    
    const description = this.generateReportDescription(report, statistics)
    
    const url = window.location.href
    
    // Генерируем URL для превью изображения
    const previewUrl = this.generatePreviewImageUrl(report, statistics)
    
    this.updatePageMeta({
      title,
      description, 
      url
    })
    
    // Добавляем специфичные для отчета мета-теги
    this.updateMetaTag('og:image', previewUrl)
    this.updateMetaTag('og:image:width', '1200')
    this.updateMetaTag('og:image:height', '630')
    this.updateMetaTag('twitter:image', previewUrl)
    this.updateMetaTag('twitter:card', 'summary_large_image')
  }

  private generateReportDescription(report: Report, statistics: ReportStatistics): string {
    const totalNews = statistics.totalNews
    const positiveCount = statistics.positiveNewsCount
    const negativeCount = statistics.negativeNewsCount
    const avgGrowth = statistics.averageGrowth.toFixed(1)
    const avgDecline = Math.abs(statistics.averageDecline).toFixed(1)
    
    const createdDate = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(report.createdAt)
    
    return `📈 Отчет от ${createdDate} • Всего новостей: ${totalNews} • Рост: ${positiveCount} (+${avgGrowth}%) • Падение: ${negativeCount} (-${avgDecline}%) • Создано: ${report.createdBy || 'Аналитик'}`
  }

  private generatePreviewImageUrl(report: Report, statistics: ReportStatistics): string {
    const baseUrl = 'https://anykeyer.github.io/NewsStat'
    
    const params = new URLSearchParams({
      title: report.title,
      total: statistics.totalNews.toString(),
      positive: statistics.positiveNewsCount.toString(),
      negative: statistics.negativeNewsCount.toString(),
      growth: statistics.averageGrowth.toFixed(1),
      decline: statistics.averageDecline.toFixed(1),
      meta: `Создано: ${report.createdBy || 'Аналитик'} • ${new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(report.createdAt)}`
    })
    
    return `${baseUrl}/report-preview.html?${params.toString()}`
  }

  resetToDefault(): void {
    this.updatePageMeta({
      title: 'News Analysis - Анализ новостей и влияния на токены',
      description: 'Анализ влияния новостей на криптовалютные токены',
      url: window.location.origin
    })
    
    // Убираем специфичные для отчета мета-теги
    this.removeMetaTag('og:image')
    this.removeMetaTag('og:image:width')
    this.removeMetaTag('og:image:height')
    this.updateMetaTag('twitter:card', 'summary')
  }

  private updateMetaTag(property: string, content: string): void {
    // Ищем существующий тег
    let metaTag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
    if (!metaTag) {
      metaTag = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement
    }
    
    // Если тег не найден, создаем новый
    if (!metaTag) {
      metaTag = document.createElement('meta')
      if (property.startsWith('og:') || property === 'twitter:card') {
        metaTag.setAttribute('property', property)
      } else {
        metaTag.setAttribute('name', property)
      }
      document.head.appendChild(metaTag)
    }
    
    // Обновляем содержимое
    metaTag.setAttribute('content', content)
  }

  private removeMetaTag(property: string): void {
    // Ищем и удаляем тег
    let metaTag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
    if (!metaTag) {
      metaTag = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement
    }
    
    if (metaTag) {
      metaTag.remove()
    }
  }
}

export default new MetaService()