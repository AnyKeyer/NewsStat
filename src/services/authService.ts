import type { User, LoginCredentials } from '@/types'
import userService from './userService'
import { mockService } from './mockService'

class AuthService {
  private readonly STORAGE_KEY = 'news-analysis-user'

  getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.STORAGE_KEY)
    if (userData) {
      try {
        return JSON.parse(userData) as User
      } catch (error) {
        console.error('Ошибка при парсинге данных пользователя:', error)
        this.logout()
      }
    }
    return null
  }

  async login(credentials: LoginCredentials): Promise<User | null> {
    try {
      console.log('Попытка входа в систему...')
      const user = await userService.authenticateUser(credentials.username, credentials.password)
      
      if (user) {
        const authenticatedUser = {
          ...user,
          isAuthenticated: true,
          displayName: user.displayName || user.username
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authenticatedUser))
        console.log(`Пользователь ${user.displayName || user.username} успешно авторизован`)
        return authenticatedUser
      }
      
      return null
    } catch (error) {
      console.error('Ошибка при входе:', error)
      throw new Error('Ошибка подключения к серверу')
    }
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser()
    return user ? (user.isAuthenticated ?? false) : false
  }
}

export default new AuthService()