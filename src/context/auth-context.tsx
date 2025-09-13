// src/context/auth-context.tsx
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { LoginResponse } from '@/lib/api'
import { getAuthToken, setAuthToken, clearAuthData, handle401Error } from '@/utils/auth-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202'

interface AuthContextType {
  user: any
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isAuthenticated = !!user

  useEffect(() => {
    const token = getAuthToken() // Usar utilidad estándar
    if (token) {
      verifyToken(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        console.log('✅ Token válido, usuario autenticado:', userData.username)
      } else if (response.status === 401) {
        console.warn('⚠️ Token inválido o expirado')
        handle401Error() // Usar utilidad estándar
      } else {
        console.error('❌ Error verificando token:', response.status)
        clearAuthData()
      }
    } catch (error) {
      console.error('❌ Error verificando token:', error)
      clearAuthData()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      console.log('🔄 Intentando login para:', username)
      
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

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const data: LoginResponse = await response.json()
        console.log('📦 Login response:', { ...data, token: data.token ? data.token.substring(0, 20) + '...' : 'NONE' })
        
        // Verificar que el login fue exitoso
        if (data.success && data.token && data.user) {
          setAuthToken(data.token) // Usar utilidad estándar
          setUser(data.user)
          console.log('✅ Login exitoso para:', data.user.username)
          return true
        } else {
          console.warn('⚠️ Login falló:', data.message)
          return false
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        console.error('❌ Login failed:', response.status, errorData)
        return false
      }
    } catch (error) {
      console.error('❌ Error en login:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const token = getAuthToken() // Usar utilidad estándar
      if (token) {
        await fetch(`${API_BASE_URL}/api/Auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }).catch(() => {
          // Si falla el logout en el backend, continuar
          console.warn('⚠️ Logout del backend falló, continuando con logout local')
        })
      }
    } finally {
      clearAuthData() // Usar utilidad estándar
      setUser(null)
      console.log('👋 Logout completado')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated }}>
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