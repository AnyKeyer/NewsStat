// Mock сервис для разработки без R2
import type { Report, User } from '@/types'

// Моковые данные в localStorage для разработки
class MockService {
  private storagePrefix = 'news-analysis-'

  // Пользователи
  getUsers(): User[] {
    const stored = localStorage.getItem(this.storagePrefix + 'users')
    if (stored) {
      return JSON.parse(stored)
    }
    
    // Дефолтные пользователи
    const defaultUsers: User[] = [
      {
        id: 'admin-001',
        username: 'alexander.petrov',
        password: 'SecurePass2024!',
        displayName: 'Александр Петров',
        isAuthenticated: false,
        role: 'admin'
      },
      {
        id: 'editor-001',
        username: 'maria.sidorova',
        password: 'EditorKey2024#',
        displayName: 'Мария Сидорова',
        isAuthenticated: false,
        role: 'editor'
      }
    ]
    
    this.saveUsers(defaultUsers)
    return defaultUsers
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(this.storagePrefix + 'users', JSON.stringify(users))
  }

  authenticateUser(username: string, password: string): User | null {
    const users = this.getUsers()
    return users.find(user => user.username === username && user.password === password) || null
  }

  // Отчеты
  getReports(): Report[] {
    const stored = localStorage.getItem(this.storagePrefix + 'reports')
    if (!stored) return []
    
    const reports = JSON.parse(stored)
    // Преобразуем строки дат обратно в Date объекты
    return reports.map((report: any) => ({
      ...report,
      createdAt: new Date(report.createdAt),
      news: report.news.map((news: any) => ({
        ...news,
        date: new Date(news.date)
      }))
    }))
  }

  saveReport(report: Report): void {
    const reports = this.getReports()
    const existingIndex = reports.findIndex(r => r.id === report.id)
    
    if (existingIndex >= 0) {
      reports[existingIndex] = report
    } else {
      reports.push(report)
    }
    
    localStorage.setItem(this.storagePrefix + 'reports', JSON.stringify(reports))
  }

  deleteReport(id: string): void {
    const reports = this.getReports().filter(r => r.id !== id)
    localStorage.setItem(this.storagePrefix + 'reports', JSON.stringify(reports))
  }
}

export const mockService = new MockService()