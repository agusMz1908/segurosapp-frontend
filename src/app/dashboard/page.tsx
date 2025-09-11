"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../context/auth-context"
import { AppLayout } from "@/components/ui/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, FileText, AlertTriangle, DollarSign, Activity, Shield, Plus, Eye } from "lucide-react"

const metrics = [
  {
    title: "Pólizas Activas",
    value: "1,234",
    change: "+12%",
    trend: "up",
    icon: FileText,
    description: "desde el mes pasado",
    color: "text-blue-600",
  },
  {
    title: "Clientes Totales",
    value: "856",
    change: "+8%",
    trend: "up",
    icon: Users,
    description: "desde el mes pasado",
    color: "text-green-600",
  },
  {
    title: "Ingresos Mensuales",
    value: "$2.4M",
    change: "+25%",
    trend: "up",
    icon: DollarSign,
    description: "desde el mes pasado",
    color: "text-emerald-600",
  },
  {
    title: "Renovaciones Pendientes",
    value: "23",
    change: "-15%",
    trend: "down",
    icon: AlertTriangle,
    description: "próximos 30 días",
    color: "text-yellow-600",
  },
]

const recentActivity = [
  {
    id: 1,
    type: "renewal",
    title: "Póliza renovada",
    description: "Cliente: María González - Hace 2 horas",
    status: "completed",
    icon: Shield,
  },
  {
    id: 2,
    type: "new",
    title: "Nueva póliza creada",
    description: "Cliente: Carlos Ruiz - Hace 4 horas",
    status: "new",
    icon: Plus,
  },
  {
    id: 3,
    type: "pending",
    title: "Renovación pendiente",
    description: "Cliente: Ana López - Vence en 5 días",
    status: "pending",
    icon: AlertTriangle,
  },
]

const monthlyMetrics = [
  { name: "Nuevas pólizas", value: 45, total: 50, color: "bg-blue-500" },
  { name: "Renovaciones", value: 32, total: 40, color: "bg-green-500" },
  { name: "Satisfacción cliente", value: 94, total: 100, color: "bg-emerald-500" },
]

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // El useEffect ya redirige
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header con saludo personalizado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
            Bienvenido, {user?.username || 'Usuario'}
            </h1>
            <p className="text-muted-foreground text-lg">
              Resumen general de tu cartera de seguros
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver reportes
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva póliza
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => {
            const Icon = metric.icon
            const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
            
            return (
              <Card key={metric.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <TrendIcon 
                      className={`h-3 w-3 mr-1 ${
                        metric.trend === "up" ? "text-green-600" : "text-red-600"
                      }`} 
                    />
                    <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>
                      {metric.change}
                    </span>
                    <span className="ml-1">{metric.description}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actividad Reciente */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>
                Últimas acciones en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                    <div className={`p-2 rounded-lg ${
                      activity.status === "completed" ? "bg-green-100 text-green-600" :
                      activity.status === "new" ? "bg-blue-100 text-blue-600" :
                      "bg-yellow-100 text-yellow-600"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <Badge variant={
                      activity.status === "completed" ? "default" :
                      activity.status === "new" ? "secondary" :
                      "outline"
                    }>
                      {activity.status === "completed" ? "Completado" :
                       activity.status === "new" ? "Nuevo" : "Pendiente"}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Métricas del Mes */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Métricas del Mes
              </CardTitle>
              <CardDescription>
                Rendimiento de octubre 2024
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {monthlyMetrics.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{metric.name}</span>
                    <span className="text-muted-foreground">
                      {metric.value}/{metric.total}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${metric.color} transition-all duration-500`}
                      style={{ width: `${(metric.value / metric.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((metric.value / metric.total) * 100)}% completado
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Herramientas frecuentemente utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Plus className="h-6 w-6" />
                <span>Nueva Póliza</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Shield className="h-6 w-6" />
                <span>Renovar Póliza</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Gestión Clientes</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>Ver Reportes</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}