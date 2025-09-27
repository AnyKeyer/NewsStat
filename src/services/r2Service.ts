import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import type { Report, NewsUrlIndexEntry } from '@/types'

class R2Service {
  private client: S3Client
  private bucketName: string

  constructor() {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID
    this.bucketName = import.meta.env.VITE_R2_BUCKET_NAME || 'news-analysis-reports'
    
    // Cloudflare R2 использует S3-совместимый API
    this.client = new S3Client({
      region: 'auto', // R2 использует 'auto' как регион
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || ''
      }
    })
  }

  async uploadReport(report: Report): Promise<void> {
    const key = `reports/${report.id}.json`
    console.log(`Сохраняем отчет в R2: ${key}`)
    console.log(`Bucket: ${this.bucketName}`)
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(report, null, 2),
      ContentType: 'application/json'
    })

    try {
      const result = await this.client.send(command)
      console.log('Отчет успешно сохранен в R2:', result)
    } catch (error) {
      console.error('Ошибка при загрузке отчета в R2:', error)
      throw new Error('Не удалось сохранить отчет')
    }
  }

  async getReport(reportId: string): Promise<Report | null> {
    // Добавляем временную метку как query-параметр к ключу для избежания потенциального кеширования прокси/браузером
    // (Сам S3 API игнорирует query при определении объекта, но некоторые промежуточные слои могли кэшировать по URL)
    const ts = Date.now()
    const key = `reports/${reportId}.json?ts=${ts}`
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      // S3 ключ не должен содержать query параметров, поэтому передаем чистый путь
      Key: key.split('?')[0]
    })

    try {
      const response = await this.client.send(command)
      if (response.Body) {
        const reportData = await this.streamToString(response.Body)
        const report = JSON.parse(reportData) as Report
        
        // Преобразуем строки дат обратно в Date объекты
        report.createdAt = new Date(report.createdAt)
        if (report.updatedAt) {
          report.updatedAt = new Date(report.updatedAt)
        }
        report.news.forEach(news => {
          news.date = new Date(news.date)
        })
        if (!report.hashtagsCache) {
          report.hashtagsCache = Array.from(new Set(report.news.flatMap(n => (n.hashtags||[]).map(h => h.toLowerCase())))).sort()
        }
        
        return report
      }
      return null
    } catch (error) {
      console.error('Ошибка при получении отчета из S3:', error)
      return null
    }
  }

  async listReports(): Promise<Array<{ id: string; title: string; createdAt: Date }>> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: 'reports/'
    })

    try {
      const response = await this.client.send(command)
      const reports: Array<{ id: string; title: string; createdAt: Date }> = []

      if (response.Contents && response.Contents.length > 0) {
        console.log(`Найдено ${response.Contents.length} файлов в R2`)
        const jsonKeys = response.Contents
          .map(i => i.Key)
          .filter((k): k is string => !!k && k.endsWith('.json'))
        // Ограничиваем конкурентность чтобы не послать слишком много одновременных запросов
        const concurrency = 6
        let index = 0
        const self = this
        async function worker() {
          while (index < jsonKeys.length) {
            const my = index++
            const keyFull = jsonKeys[my]
            const reportId = keyFull.replace('reports/', '').replace('.json', '')
            try {
              const report = await self.getReport(reportId)
              if (report) {
                reports.push({ id: report.id, title: report.title, createdAt: report.createdAt })
              }
            } catch (err) {
              console.error(`Ошибка загрузки отчета ${reportId}:`, err)
            }
          }
        }
        const workers = Array.from({ length: Math.min(concurrency, jsonKeys.length) }, () => worker())
        await Promise.all(workers)
      } else {
        console.log('Файлы отчетов не найдены в R2')
      }

      console.log(`Итого загружено отчетов: ${reports.length}`)
      // Сортируем по дате создания (новые первыми)
      return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Ошибка при получении списка отчетов из R2:', error)
      return []
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    const key = `reports/${reportId}.json`
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    })

    try {
      await this.client.send(command)
    } catch (error) {
      console.error('Ошибка при удалении отчета из R2:', error)
      throw error
    }
  }

  private async streamToString(stream: any): Promise<string> {
    // В браузерной версии AWS SDK stream может быть ReadableStream или Uint8Array
    if (stream instanceof Uint8Array) {
      return new TextDecoder().decode(stream)
    }
    
    if (stream && typeof stream.transformToString === 'function') {
      return await stream.transformToString()
    }
    
    // Fallback для Node.js-like streams
    if (stream && typeof stream.on === 'function') {
      const chunks: Uint8Array[] = []
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks)
          resolve(buffer.toString('utf-8'))
        })
      })
    }
    
    throw new Error('Неподдерживаемый тип stream')
  }

  // ===== Hashtags Index Handling =====
  private hashtagIndexKey = 'indexes/hashtags.json'

  async getHashtagIndex(): Promise<{ tags: string[]; updatedAt: string } | null> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: this.hashtagIndexKey })
    try {
      const res = await this.client.send(command)
      if (!res.Body) return null
      const data = JSON.parse(await this.streamToString(res.Body))
      if (!Array.isArray(data.tags)) return null
      return data
    } catch (e) {
      // 404 или другая ошибка — возвращаем null, не падаем
      return null
    }
  }

  async putHashtagIndex(tags: string[]): Promise<void> {
    const unique = Array.from(new Set(tags.map(t => t.toLowerCase()).filter(Boolean))).sort()
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: this.hashtagIndexKey,
      Body: JSON.stringify({ tags: unique, updatedAt: new Date().toISOString() }, null, 2),
      ContentType: 'application/json'
    })
    await this.client.send(command)
  }

  async mergeHashtags(incoming: string[]): Promise<string[]> {
    if (!incoming.length) return (await this.getHashtagIndex())?.tags || []
    const current = (await this.getHashtagIndex())?.tags || []
    const merged = Array.from(new Set([...current, ...incoming.map(t => t.toLowerCase())].filter(Boolean))).sort()
    // Только если реально появились новые — записываем
    if (merged.length !== current.length) {
      await this.putHashtagIndex(merged)
    }
    return merged
  }

  // ===== News URL Duplicate Index =====
  private newsUrlIndexKey = 'indexes/news-urls.json'

  private normalizeUrl(raw: string): string {
    try {
      const u = new URL(raw.trim())
      u.hash = ''
      // Удаляем мусорные параметры отслеживания
      const paramsToStrip = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','ref_src','gclid','fbclid']
      paramsToStrip.forEach(p => u.searchParams.delete(p))
      // Сортируем параметры для стабильности
      const entries = Array.from(u.searchParams.entries()).sort(([a],[b]) => a.localeCompare(b))
      u.search = entries.length ? '?' + entries.map(([k,v]) => `${k}=${v}`).join('&') : ''
      // Удаляем завершающий слеш кроме корня
      if (u.pathname.endsWith('/') && u.pathname !== '/') {
        u.pathname = u.pathname.slice(0, -1)
      }
      return u.toString().toLowerCase()
    } catch {
      return raw.trim().toLowerCase()
    }
  }

  private async getNewsUrlIndex(): Promise<NewsUrlIndexEntry[] | null> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: this.newsUrlIndexKey })
    try {
      const res = await this.client.send(command)
      if (!res.Body) return null
      const data = JSON.parse(await this.streamToString(res.Body))
      if (!Array.isArray(data.entries)) return null
      return data.entries as NewsUrlIndexEntry[]
    } catch {
      return null
    }
  }

  private async putNewsUrlIndex(entries: NewsUrlIndexEntry[]): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: this.newsUrlIndexKey,
      Body: JSON.stringify({ updatedAt: new Date().toISOString(), entries }, null, 2),
      ContentType: 'application/json'
    })
    await this.client.send(command)
  }

  async indexReportNews(report: Report): Promise<void> {
    const existing = await this.getNewsUrlIndex() || []
    // удаляем все предыдущие записи об этом отчете (на случай обновления)
    const filtered = existing.filter(e => e.reportId !== report.id)
    const additions: NewsUrlIndexEntry[] = report.news.filter(n => n.url).map(n => ({
      normalizedUrl: this.normalizeUrl(n.url),
      originalUrl: n.url,
      reportId: report.id,
      reportTitle: report.title,
      newsId: n.id,
      newsTitle: n.title,
      date: n.date instanceof Date ? n.date.toISOString() : new Date(n.date).toISOString()
    }))
    await this.putNewsUrlIndex([...filtered, ...additions])
  }

  async removeReportFromUrlIndex(reportId: string): Promise<void> {
    const existing = await this.getNewsUrlIndex()
    if (!existing) return
    const filtered = existing.filter(e => e.reportId !== reportId)
    await this.putNewsUrlIndex(filtered)
  }

  async findUrlDuplicates(url: string): Promise<NewsUrlIndexEntry[]> {
    if (!url || !url.trim()) return []
    const norm = this.normalizeUrl(url)
    let existing = await this.getNewsUrlIndex()
    // Если индекса нет — попробуем лениво пересобрать из имеющихся отчетов (дорого при большом числе отчетов, но одноразово)
    if (!existing) {
      try {
        const list = await this.listReports()
        const rebuilt: NewsUrlIndexEntry[] = []
        for (const r of list) {
          const full = await this.getReport(r.id)
            if (full) {
              for (const n of full.news) {
                if (!n.url) continue
                rebuilt.push({
                  normalizedUrl: this.normalizeUrl(n.url),
                  originalUrl: n.url,
                  reportId: full.id,
                  reportTitle: full.title,
                  newsId: n.id,
                  newsTitle: n.title,
                  date: n.date instanceof Date ? n.date.toISOString() : new Date(n.date).toISOString()
                })
              }
            }
        }
        await this.putNewsUrlIndex(rebuilt)
        existing = rebuilt
      } catch (e) {
        console.warn('Не удалось лениво пересобрать индекс URL', e)
        existing = []
      }
    }
    return existing.filter(e => e.normalizedUrl === norm)
  }
}

export default new R2Service()