import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import type { User } from '@/types'

class UserService {
  private client: S3Client
  private bucketName: string

  constructor() {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID
    this.bucketName = import.meta.env.VITE_R2_BUCKET_NAME || 'news-analysis-reports'
    
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || ''
      }
    })
  }

  async getUsers(): Promise<User[]> {
    const key = 'users/users.json'
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    })

    try {
      const response = await this.client.send(command)
      if (response.Body) {
        const usersData = await this.streamToString(response.Body)
        let users = [] as User[]
        try {
          users = JSON.parse(usersData) as User[]
        } catch (e) {
          console.warn('Не удалось распарсить users.json, пересоздаем из окружения')
          users = this.getDefaultUsers()
          await this.saveUsers(users)
          return users
        }

        // Синхронизация: если в env заданы пользователи, но их нет в файле – добавим.
        let changed = false
        const adminUsername = import.meta.env.VITE_DEFAULT_ADMIN_USERNAME
        const adminPassword = import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD
        if (adminUsername && adminPassword && !users.some(u => u.role === 'admin')) {
          users.push({
            id: 'admin-001',
            username: adminUsername,
            password: adminPassword,
            displayName: 'Администратор',
            isAuthenticated: false,
            role: 'admin'
          })
          changed = true
        }
        const editorUsername = import.meta.env.VITE_DEFAULT_EDITOR_USERNAME
        const editorPassword = import.meta.env.VITE_DEFAULT_EDITOR_PASSWORD
        if (editorUsername && editorPassword && !users.some(u => u.role === 'editor')) {
          users.push({
            id: 'editor-001',
            username: editorUsername,
            password: editorPassword,
            displayName: 'Редактор',
            isAuthenticated: false,
            role: 'editor'
          })
          changed = true
        }
        if (changed) {
          await this.saveUsers(users)
        }
        return users
      }
    } catch (error) {
      console.log('Файл пользователей не найден, создаем дефолтных пользователей')
      // Если файла нет, создаем дефолтных пользователей
      const defaultUsers = this.getDefaultUsers()
      await this.saveUsers(defaultUsers)
      return defaultUsers
    }

    return []
  }

  async saveUsers(users: User[]): Promise<void> {
    const key = 'users/users.json'
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(users, null, 2),
      ContentType: 'application/json'
    })

    try {
      await this.client.send(command)
    } catch (error) {
      console.error('Ошибка при сохранении пользователей:', error)
      throw new Error('Не удалось сохранить пользователей')
    }
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const users = await this.getUsers()
    const user = users.find(u => u.username === username && u.password === password)
    
    if (user) {
      return {
        ...user,
        isAuthenticated: true
      }
    }
    
    return null
  }

  private getDefaultUsers(): User[] {
    const users: User[] = []
    
    // Администратор из переменных окружения
    const adminUsername = import.meta.env.VITE_DEFAULT_ADMIN_USERNAME
    const adminPassword = import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD
    
    if (adminUsername && adminPassword) {
      users.push({
        id: 'admin-001',
        username: adminUsername,
        password: adminPassword,
        displayName: 'Администратор',
        isAuthenticated: false,
        role: 'admin'
      })
    }
    
    // Редактор из переменных окружения (опционально)
    const editorUsername = import.meta.env.VITE_DEFAULT_EDITOR_USERNAME
    const editorPassword = import.meta.env.VITE_DEFAULT_EDITOR_PASSWORD
    
    if (editorUsername && editorPassword) {
      users.push({
        id: 'editor-001',
        username: editorUsername,
        password: editorPassword,
        displayName: 'Редактор',
        isAuthenticated: false,
        role: 'editor'
      })
    }
    
    return users
  }

  private async streamToString(stream: any): Promise<string> {
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
}

export default new UserService()