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
        return JSON.parse(usersData) as User[]
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
    return [
      {
        id: 'admin-001',
        username: 'alexander.petrov',
        password: 'SecurePass2024!',
        displayName: 'Александр Петров',
        isAuthenticated: false,
        role: 'admin' // Полные права: создание и удаление отчетов
      },
      {
        id: 'editor-001',
        username: 'maria.sidorova',
        password: 'EditorKey2024#',
        displayName: 'Мария Сидорова',
        isAuthenticated: false,
        role: 'editor' // Права редактора: только создание отчетов
      }
    ]
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