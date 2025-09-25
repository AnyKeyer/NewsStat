export interface NewsItem {
  id: string
  title: string
  text: string
  url: string
  tokenName: string
  /** Ссылка на страницу токена (например CoinGecko / TradingView / DexScreener) */
  tokenUrl?: string
  /** Ссылка на скриншот / изображение (можно imgur / прямой CDN) */
  screenshotUrl?: string
  comment: string
  impact: number // процент изменения (может быть положительным или отрицательным)
  date: Date
  /** Цена реально изменилась вскоре после новости (подтвержденное влияние) */
  priceMoved?: boolean
  /** Нужен специализированный софт / инструменты чтобы воспользоваться ситуацией ("без софта не взять") */
  needsSoftware?: boolean
  /** Хэштеги связанные с новостью (без символа #, храним в нижнем регистре для унификации отображение можно делать в верхнем) */
  hashtags?: string[]
}

export interface Report {
  id: string
  title: string
  description?: string
  news: NewsItem[]
  createdAt: Date
  createdBy?: string
  updatedAt?: Date
  /** Опционально кэш уникальных хэштегов (может быть заполнен при сохранении для ускорения фильтрации). Не обязателен для старых отчетов. */
  hashtagsCache?: string[]
}

export interface ReportStatistics {
  totalNews: number
  workingNews: number // все новости считаются рабочими
  averageGrowth: number
  averageDecline: number
  positiveNewsCount: number
  negativeNewsCount: number
  /** Количество новостей, после которых цена реально двинулась */
  movedCount: number
  /** Количество новостей, после которых цена не изменилась */
  staticCount: number
  /** Количество новостей без отметки (priceMoved не указан) */
  unmarkedCount: number
  /** Процент новостей с движением (movedCount / totalNews * 100) */
  movedPercent: number
}

export interface User {
  id: string
  username: string
  password: string
  displayName?: string
  isAuthenticated?: boolean
  role: 'editor' | 'admin' // editor - может создавать, admin - может создавать и удалять
}

export interface LoginCredentials {
  username: string
  password: string
}