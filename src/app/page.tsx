"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Pequeño delay para evitar flickering
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Verificar si hay token en cookies
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('seguros_token='))
          ?.split('=')[1]
        
        // También verificar en localStorage como backup
        const localToken = localStorage.getItem('auth_token')
        
        console.log('Root page - Token found:', !!(token || localToken))
        
        if (token || localToken) {
          // Usuario autenticado, ir al dashboard
          console.log('Redirecting to dashboard...')
          router.replace('/dashboard')
        } else {
          // Usuario no autenticado, ir al login
          console.log('Redirecting to login...')
          router.replace('/login')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        // En caso de error, ir al login por seguridad
        router.replace('/login')
      } finally {
        // Delay mínimo para mostrar el loading
        setTimeout(() => setIsLoading(false), 200)
      }
    }

    checkAuth()
  }, [router])

  // Mostrar loading mientras verificamos la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          {/* Logo/Icono de la aplicación */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 rounded-full p-4 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SegurosApp
          </h1>
          
          {/* Loading spinner */}
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Verificando autenticación...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}