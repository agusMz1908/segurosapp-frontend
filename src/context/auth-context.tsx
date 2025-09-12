"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: number
  username: string
  email: string
}

interface LoginResponse {
  success: boolean
  message: string
  token: string
  expiresAt: string
  user: User
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ✅ Corregir la lógica de isAuthenticated
  const isAuthenticated = !!user

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Buscar token en cookies primero, luego en localStorage
      const cookieToken = getCookieToken()
      const localToken = localStorage.getItem('auth_token') // Usar nombre consistente
      const token = cookieToken || localToken

      console.log('Auth initialization - Token found:', !!token)

      if (token) {
        // Intentar verificar el token
        const userData = await verifyToken(token)
        if (userData) {
          setUser(userData)
          console.log('User authenticated:', userData)
        } else {
          // Token inválido, limpiar
          clearTokens()
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      clearTokens()
    } finally {
      setIsLoading(false)
    }
  }

  const getCookieToken = (): string | null => {
    if (typeof document === 'undefined') return null
    
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('seguros_token='))
      ?.split('=')[1] || null
  }

  const clearTokens = () => {
    // Limpiar cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'seguros_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    
    // Limpiar localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    
    setUser(null)
  }

  const verifyToken = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        return userData
      } else {
        console.warn('Token verification failed:', response.status)
        return null
      }
    } catch (error) {
      console.error('Error verifying token:', error)
      return null
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username,
          password: password 
        }),
      })

      if (response.ok) {
        const data: LoginResponse = await response.json()
        
        if (data.success && data.token && data.user) {
          // Guardar en ambos lugares para consistencia
          localStorage.setItem('auth_token', data.token)
          localStorage.setItem('user_data', JSON.stringify(data.user))
          
          // También en cookie
          document.cookie = `seguros_token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`
          
          setUser(data.user)
          console.log('Login successful, user set:', data.user)
          return true
        }
        
        return false
      } else {
        console.error('Login failed:', response.status)
        return false
      }
    } catch (error) {
      console.error('Error en login:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const token = getCookieToken() || localStorage.getItem('auth_token')
      
      if (token) {
        // Intentar logout en backend
        await fetch(`${API_BASE_URL}/api/Auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }).catch(() => {
          // Si falla el logout en el backend, continuar con limpieza local
          console.warn('Backend logout failed, continuing with local cleanup')
        })
      }
    } finally {
      clearTokens()
      console.log('Logout complete')
    }
  }

  const contextValue = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}