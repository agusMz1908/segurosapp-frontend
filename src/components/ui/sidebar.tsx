"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Plus,
  RotateCcw,
  FileText,
  Users,
  TrendingUp,
  Settings,
  ChevronLeft,
  Shield,
  Building2,
  Bell,
} from "lucide-react"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: BarChart3,
    notifications: 0,
  },
  {
    title: "Nueva Póliza",
    href: "/nueva-poliza",
    icon: Plus,
    notifications: 0,
  },
  {
    title: "Renovar/Modificar",
    href: "/renovar",
    icon: RotateCcw,
    notifications: 3,
  },
  {
    title: "Pólizas",
    href: "/polizas",
    icon: FileText,
    notifications: 0,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
    notifications: 0,
  },
  {
    title: "Métricas",
    href: "/metricas",
    icon: TrendingUp,
    notifications: 0,
  },
  {
    title: "Configuración",
    href: "/config",
    icon: Settings,
    notifications: 0,
  },
]

export function Sidebar() {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar()
  const pathname = usePathname()

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobile && isCollapsed && "translate-x-[-100%]",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo y Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            <div
              className={cn(
                "flex items-center gap-2 transition-opacity duration-200",
                isCollapsed ? "opacity-0 w-0" : "opacity-100",
              )}
            >
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-sidebar-foreground">SegurosApp</span>
            </div>

            {isCollapsed ? (
              <div className="flex items-center justify-center w-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground",
                    isCollapsed && "justify-center px-2",
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.notifications > 0 && (
                        <Badge variant="secondary" className="h-5 w-5 p-0 text-xs bg-warning text-warning-foreground">
                          {item.notifications}
                        </Badge>
                      )}
                    </>
                  )}
                  {isCollapsed && item.notifications > 0 && (
                    <div className="absolute top-1 right-1 h-2 w-2 bg-warning rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {isCollapsed ? (
            <div className="p-4 border-t border-sidebar-border flex justify-center">
              <div className="relative">
                <Bell className="h-5 w-5 text-sidebar-foreground" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-warning rounded-full"></div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-2 text-sm text-sidebar-foreground">
                <Bell className="h-4 w-4" />
                <span>5 notificaciones pendientes</span>
              </div>
            </div>
          )}

          {/* Información del tenant */}
          <div className="p-4 border-t border-sidebar-border">
            <div className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
              <Building2 className="h-5 w-5 text-sidebar-foreground flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">Seguros Empresariales S.A.</p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">Tenant: SEMP001</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
