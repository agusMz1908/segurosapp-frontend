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
    const token = getAuthToken() 
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
      } else if (response.status === 401) {
        handle401Error() 
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
          setAuthToken(data.token) 
          setUser(data.user)
          return true
        } else {
          console.warn('⚠️ Login falló:', data.message)
          return false
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
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
      const token = getAuthToken() 
      if (token) {
        await fetch(`${API_BASE_URL}/api/Auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }).catch(() => {
          console.warn('⚠️ Logout del backend falló, continuando con logout local')
        })
      }
    } finally {
      clearAuthData() 
      setUser(null)
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