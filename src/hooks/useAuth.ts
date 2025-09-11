"use client"

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export interface user {
  id: number
  username: string
  email: string
}

export function useAuth() {
  const router = useRouter()

  const logout = useCallback(async () => {
    try {
      document.cookie = 'seguros_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=strict'

      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      sessionStorage.clear()
    
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        })
      } catch (error) {
        console.warn('Error al notificar logout al servidor:', error)
      }

      router.push('/login')
      router.refresh() 
      
    } catch (error) {
      console.error('Error durante logout:', error)
      window.location.href = '/login'
    }
  }, [router])

  const getUser = useCallback((): user | null => {
    try {
      const userData = localStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }, [])

  const getToken = useCallback((): string | null => {
    return localStorage.getItem('auth_token')
  }, [])

  const isAuthenticated = useCallback((): boolean => {
    const token = getToken()
    const user = getUser()
    return !!(token && user)
  }, [getToken, getUser])

  return {
    logout,
    getUser,
    getToken,
    isAuthenticated
  }
}