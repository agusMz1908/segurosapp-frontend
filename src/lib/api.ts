// lib/api.ts
"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  // ✅ MÉTODO MEJORADO para obtener token - busca en todos los lugares posibles
  private getAuthToken(): string {
    // 1. Intentar desde cookies (seguros_token)
    const cookieToken = typeof document !== 'undefined' 
      ? document.cookie
          .split('; ')
          .find(row => row.startsWith('seguros_token='))
          ?.split('=')[1]
      : null
    
    // 2. Intentar desde localStorage (auth_token - como se guarda en login)
    const localToken = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null
    
    // 3. Backup: auth-token (del auth-context.tsx)
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
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }), // ✅ Incluir token si existe
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      console.log(`📡 Response: ${response.status} ${response.statusText}`)
      
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
        
        // ✅ Manejo específico de errores 401 (sin autorización)
        if (response.status === 401) {
          console.error('🚫 Error 401: Token inválido o expirado')
          // Limpiar tokens inválidos
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth-token')
            localStorage.removeItem('user_data')
          }
          // Opcional: redirigir a login
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
        
        const error = new Error(errorMessage)
        ;(error as any).response = { status: response.status, data: errorData }
        throw error
      }
      
      const result = await response.json()
      
      // ✅ Si es un ApiResponse wrapper, extraer los datos
      if (typeof result === 'object' && result !== null && 'success' in result && 'data' in result) {
        console.log('📦 ApiResponse wrapper detectado')
        return result.data || result
      }
      
      return result
      
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ API Error:', error.message)
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

// =================== RESPONSE TYPES ===================

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

// =================== UTILITY FUNCTIONS ===================

/**
 * Verifica si el usuario está autenticado
 */
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

/**
 * Obtiene la información del usuario actual
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  
  try {
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

/**
 * Logout completo - limpia todos los tokens y datos
 */
export function logout() {
  if (typeof window === 'undefined') return
  
  // Limpiar localStorage
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth-token')
  localStorage.removeItem('user_data')
  
  // Limpiar cookies
  document.cookie = 'seguros_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
  
  // Redirigir a login
  window.location.href = '/login'
}