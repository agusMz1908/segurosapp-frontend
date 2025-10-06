"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth, type user } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { useSidebar } from "../../hooks/use-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Search,
  Bell,
  Menu,
  ChevronRight,
  Building2,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

const breadcrumbMap: Record<string, string[]> = {
  "/": ["Dashboard"],
  "/nueva-poliza": ["Nueva Póliza"],
  "/renovaciones": ["Renovaciones"], 
  "/cambios": ["Cambios"], 
  "/polizas": ["Pólizas"],
  "/clientes": ["Clientes"],
  "/facturacion": ["Facturación"]
}

export function Header() {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { logout, getUser } = useAuth()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
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

  const breadcrumbs = breadcrumbMap[pathname] || ["Dashboard"]

  return (
    <header
      className={cn(
        "fixed top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300",
        isCollapsed ? "left-0 md:left-16 right-0" : "left-0 md:left-64 right-0"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button - Solo para mobile */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">SegurosApp</span>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1" />
                <span
                  className={cn(
                    index === breadcrumbs.length - 1 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground"
                  )}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
        </div>

        {/* Right Section - Actions + User Menu */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Cambiar tema</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="Usuario" />
                  <AvatarFallback>
                    {user ? user.username.substring(0, 2).toUpperCase() : 'US'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
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
    </header>
  )
}