"use client"

import { useState } from "react"
import { Eye, EyeOff, User, Lock, Shield, FileText, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false
  })
  const [errors, setErrors] = useState({
    username: "",
    password: ""
  })

  const validateForm = () => {
    const newErrors = { username: "", password: "" }
    
    if (!formData.username.trim()) {
      newErrors.username = "El usuario es requerido"
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es requerida"
    }
    
    setErrors(newErrors)
    return !newErrors.username && !newErrors.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    console.log("Login data:", formData)
    
    // Simulación
    setTimeout(() => {
      setIsLoading(false)
      alert("Login simulado exitoso!")
    }, 1000)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (field === "username" && errors.username) {
      setErrors(prev => ({ ...prev, username: "" }))
    }
    if (field === "password" && errors.password) {
      setErrors(prev => ({ ...prev, password: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-12">
        <div className="flex flex-col justify-center">
          <div className="flex items-center mb-8">
            <Shield className="w-12 h-12 mr-4" />
            <h1 className="text-4xl font-bold">SegurosApp</h1>
          </div>
          <p className="text-xl mb-8">Sistema de gestión de pólizas de seguros</p>
          <div className="space-y-4">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-3" />
              <span>Gestión integral de pólizas</span>
            </div>
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-3" />
              <span>Documentación centralizada</span>
            </div>
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-3" />
              <span>Reportes y análisis avanzados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
              <p className="text-center text-gray-600">Accede a tu panel de control</p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ingresa tu usuario"
                      className="pl-10 h-12"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      autoFocus
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      className="pl-10 pr-10 h-12"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange("rememberMe", !!checked)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                    Recordarme
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}