export interface NewsItem {
  id: string
  title: string
  text: string
  url: string
  tokenName: string
  comment: string
  impact: number // процент изменения (может быть положительным или отрицательным)
  date: Date
}

export interface Report {
  id: string
  title: string
  description?: string
  news: NewsItem[]
  createdAt: Date
  createdBy?: string
}

export interface ReportStatistics {
  totalNews: number
  workingNews: number // все новости считаются рабочими
  averageGrowth: number
  averageDecline: number
  positiveNewsCount: number
  negativeNewsCount: number
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