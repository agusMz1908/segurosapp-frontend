"use client"

import type React from "react"
import { Sidebar } from "./sidebar"
import { useSidebar } from "../../hooks/use-sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={toggleSidebar}
        />
      )}

      <div className={`transition-all duration-300 ${isCollapsed ? "md:ml-16" : "md:ml-64"}`}>
        <main className="p-4 md:p-6 lg:p-8 min-h-screen">
          <div className="w-full h-full">
            {children}
          </div>
        </main>

        <footer className="border-t bg-muted/30 py-4 px-4 md:px-6 lg:px-8">
          <div className="w-full text-center text-sm text-muted-foreground">
            © 2025 SegurosApp. Todos los derechos reservados.
          </div>
        </footer>
      </div>
    </div>
  )
}