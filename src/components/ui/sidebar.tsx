"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, type user } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { useSidebar } from "../../hooks/use-sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  FileText,
  RotateCcw,
  Edit,
  Users,
  BarChart3,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useTheme } from "next-themes"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Nueva Póliza", href: "/nueva-poliza", icon: FileText },
  { name: "Renovaciones", href: "/renovaciones", icon: RotateCcw },
  { name: "Cambios", href: "/cambios", icon: Edit },
  { name: "Pólizas", href: "/polizas", icon: FileText },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Métricas", href: "/metricas", icon: BarChart3 },
  { name: "Configuración", href: "/config", icon: Settings },
]

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { logout, getUser } = useAuth()
  const pathname = usePathname()
  const [user, setUser] = useState<user | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const userData = getUser()
    setUser(userData)
  }, [getUser])

  // Función para manejar logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header del Sidebar */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">SegurosApp</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Controles de usuario en la parte inferior */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {/* Toggle de tema */}
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isCollapsed ? "justify-center h-8 w-8" : "justify-start gap-3 h-9"
            )}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            {!isCollapsed && <span>Cambiar tema</span>}
          </Button>

          {/* Información del usuario */}
          {!isCollapsed && (
            <div className="px-3 py-2 text-xs text-sidebar-foreground/70">
              <div className="font-medium">{user?.username || 'Usuario'}</div>
              <div className="text-sidebar-foreground/50">{user?.email || 'usuario@segurosapp.com'}</div>
            </div>
          )}

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "sm"}
                className={cn(
                  "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed ? "justify-center h-8 w-8" : "justify-start gap-3 h-9"
                )}
              >
                <Avatar className={cn(isCollapsed ? "h-5 w-5" : "h-6 w-6")}>
                  <AvatarImage src="/avatars/01.png" alt="Usuario" />
                  <AvatarFallback className="text-xs">
                    {user ? user.username.substring(0, 2).toUpperCase() : 'US'}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && <span>Menú de usuario</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56" 
              align="end" 
              side={isCollapsed ? "right" : "top"}
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.username || 'Usuario'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'usuario@segurosapp.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>
                  {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  )
}