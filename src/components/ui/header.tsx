"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-provider"
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
  PanelLeftOpen,
} from "lucide-react"
import { useTheme } from "next-themes"

const breadcrumbMap: Record<string, string[]> = {
  "/": ["Dashboard"],
  "/nueva-poliza": ["Nueva Póliza"],
  "/renovar": ["Renovar", "Modificar"],
  "/polizas": ["Pólizas"],
  "/clientes": ["Clientes"],
  "/metricas": ["Métricas"],
  "/config": ["Configuración"],
}

export function Header() {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")

  const breadcrumbs = breadcrumbMap[pathname] || ["Dashboard"]

  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300",
        isCollapsed ? "md:left-16" : "md:left-64",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section - Mobile Menu + Expand Button + Breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {isCollapsed && !isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden md:flex bg-primary/10 hover:bg-primary/20 text-primary"
            >
              <PanelLeftOpen className="h-5 w-5" />
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
                    index === breadcrumbs.length - 1 ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar pólizas, clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-error text-error-foreground">3</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Póliza próxima a vencer</p>
                  <p className="text-xs text-muted-foreground">La póliza #12345 vence en 5 días</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Nuevo cliente registrado</p>
                  <p className="text-xs text-muted-foreground">Juan Pérez se registró hace 2 horas</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tenant Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden md:flex items-center gap-2 h-9">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">SEMP001</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Cambiar Empresa</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">Seguros Empresariales S.A.</span>
                  <span className="text-xs text-muted-foreground">SEMP001</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">Seguros Generales Ltda.</span>
                  <span className="text-xs text-muted-foreground">SGEN002</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="Usuario" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Juan Díaz</p>
                  <p className="text-xs leading-none text-muted-foreground">juan.diaz@segurosapp.com</p>
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
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
