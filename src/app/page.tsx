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
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('seguros_token='))
          ?.split('=')[1]
        
        const localToken = localStorage.getItem('auth_token')
        
        if (token || localToken) {
          router.replace('/dashboard')
        } else {
          router.replace('/login')
        }
      } catch (error) {
        router.replace('/login')
      } finally {
        setTimeout(() => setIsLoading(false), 200)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 rounded-full p-4 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SegurosApp
          </h1>

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