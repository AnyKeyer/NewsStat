import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import type { Report } from '@/types'

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
    const key = `reports/${reportId}.json`
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    })

    try {
      const response = await this.client.send(command)
      if (response.Body) {
        const reportData = await this.streamToString(response.Body)
        const report = JSON.parse(reportData) as Report
        
        // Преобразуем строки дат обратно в Date объекты
        report.createdAt = new Date(report.createdAt)
        report.news.forEach(news => {
          news.date = new Date(news.date)
        })
        
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
        
        for (const item of response.Contents) {
          if (item.Key && item.Key.endsWith('.json')) {
            const reportId = item.Key.replace('reports/', '').replace('.json', '')
            console.log(`Загружаем отчет: ${reportId}`)
            
            try {
              // Получаем краткую информацию о отчете
              const report = await this.getReport(reportId)
              if (report) {
                reports.push({
                  id: report.id,
                  title: report.title,
                  createdAt: report.createdAt
                })
                console.log(`Добавлен отчет: ${report.title}`)
              }
            } catch (err) {
              console.error(`Ошибка загрузки отчета ${reportId}:`, err)
              // Продолжаем загрузку других отчетов
            }
          }
        }
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
}

export default new R2Service()