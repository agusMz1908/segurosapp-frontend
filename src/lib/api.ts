"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getAuthToken(): string {
    const cookieToken = typeof document !== 'undefined' 
      ? document.cookie
          .split('; ')
          .find(row => row.startsWith('seguros_token='))
          ?.split('=')[1]
      : null

    const localToken = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null

    const backupToken = typeof localStorage !== 'undefined'
      ? localStorage.getItem('auth-token')
      : null
    
    const token = cookieToken || localToken || backupToken || ''
    
    if (token) {
      console.log('🔑 Token encontrado:', token.substring(0, 20) + '...')
    } else {
      console.warn('⚠️ No se encontró token de autenticación')
    }
    
    return token
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getAuthToken()
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }), 
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    }

    try {
      const response = await fetch(url, config)
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        let errorData: any = null
        
        try {
          const errorText = await response.text()
          if (errorText) {
            try {
              errorData = JSON.parse(errorText)
              errorMessage = errorData.message || errorData.Message || errorMessage
            } catch {
              errorMessage = errorText
            }
          }
        } catch {
          // Si no se puede leer el error, usar mensaje por defecto
        }
        
        if (response.status === 401) {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth-token')
            localStorage.removeItem('user_data')
          }
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
        
        const error = new Error(errorMessage)
        ;(error as any).response = { status: response.status, data: errorData }
        throw error
      }
      
      const result = await response.json()

      if (typeof result === 'object' && result !== null && 'success' in result && 'data' in result) {
        return result.data || result
      }
      
      return result
      
    } catch (error) {
      if (error instanceof Error) {
        console.error('API Error:', error.message)
      }
      throw error
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

export { API_BASE_URL }

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  timestamp: string
  errors?: string[]
}

export interface LoginResponse {
  success: boolean
  message: string
  token?: string
  expiresAt?: string
  user?: {
    id: number
    username: string
    email: string
  }
}

export interface ApiError {
  message: string
  status: number
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  const token = localStorage.getItem('auth_token') || 
                localStorage.getItem('auth-token') ||
                document.cookie
                  .split('; ')
                  .find(row => row.startsWith('seguros_token='))
                  ?.split('=')[1]
  
  const user = localStorage.getItem('user_data')
  
  return !!(token && user)
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  
  try {
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

export function logout() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth-token')
  localStorage.removeItem('user_data')

  document.cookie = 'seguros_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'

  window.location.href = '/login'
}