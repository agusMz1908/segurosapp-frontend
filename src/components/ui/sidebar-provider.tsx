"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
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
  PanelLeftOpen,
  PanelLeftClose,
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
        "fixed top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300",
        isCollapsed ? "left-0 md:left-16 right-0" : "left-0 md:left-64 right-0"
      )}
      suppressHydrationWarning
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="md:hidden"
            suppressHydrationWarning
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* 🔥 DESKTOP TOGGLE BUTTON - SIEMPRE VISIBLE EN DESKTOP */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex bg-primary/10 hover:bg-primary/20 text-primary ring-2 ring-primary/30"
            title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            suppressHydrationWarning
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>

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

        {/* Center Section - Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Buscar pólizas, clientes..."
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right Section - Actions + User Menu */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            suppressHydrationWarning
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Cambiar tema</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/avatars/01.png" alt="Avatar" />
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Usuario Admin</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@segurosapp.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Empresa</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
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