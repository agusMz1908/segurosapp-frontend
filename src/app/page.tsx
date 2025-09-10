import { AppLayout } from "@/components/ui/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, FileText, AlertTriangle, CheckCircle } from "lucide-react"

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">Resumen general de tu cartera de seguros</p>
        </div>

        {/* Stats Cards - Mejorado espaciado y tamaños */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-medium">Pólizas Activas</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">1,234</div>
              <p className="text-sm text-muted-foreground">+12% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-medium">Clientes Totales</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">856</div>
              <p className="text-sm text-muted-foreground">+8% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-medium">Ingresos Mensuales</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success mb-1">$2.4M</div>
              <p className="text-sm text-muted-foreground">+15% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-medium">Renovaciones Pendientes</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning mb-1">23</div>
              <p className="text-sm text-muted-foreground">Próximas 30 días</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Mejorado espaciado y altura de las tarjetas */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Actividad Reciente</CardTitle>
              <CardDescription className="text-base">Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium">Póliza renovada</p>
                  <p className="text-sm text-muted-foreground">Cliente: María González - Hace 2 horas</p>
                </div>
                <Badge variant="outline" className="text-success border-success">
                  Completado
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium">Nueva póliza creada</p>
                  <p className="text-sm text-muted-foreground">Cliente: Carlos Ruiz - Hace 4 horas</p>
                </div>
                <Badge variant="outline" className="text-primary border-primary">
                  Nuevo
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium">Renovación pendiente</p>
                  <p className="text-sm text-muted-foreground">Cliente: Ana López - Vence en 5 días</p>
                </div>
                <Badge variant="outline" className="text-warning border-warning">
                  Pendiente
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Métricas del Mes</CardTitle>
              <CardDescription className="text-base">Rendimiento de octubre 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span>Nuevas pólizas</span>
                  <span className="font-medium">45</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full w-[75%] transition-all duration-500"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span>Renovaciones</span>
                  <span className="font-medium">32</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-success h-3 rounded-full w-[64%] transition-all duration-500"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span>Satisfacción cliente</span>
                  <span className="font-medium">94%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-success h-3 rounded-full w-[94%] transition-all duration-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
