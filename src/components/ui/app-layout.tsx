"use client"

import type React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { useSidebar } from "./sidebar-provider"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isCollapsed, isMobile } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Overlay para mobile */}
      {isMobile && !isCollapsed && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => {}} />}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? "md:ml-16" : "md:ml-64"}`}>
        <Header />

        {/* Content Area */}
        <main className="p-4 md:p-6 lg:p-8 pt-20">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Footer opcional */}
        <footer className="border-t bg-muted/30 py-4 px-4 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
            © 2024 SegurosApp. Todos los derechos reservados.
          </div>
        </footer>
      </div>
    </div>
  )
}
