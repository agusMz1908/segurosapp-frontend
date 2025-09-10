"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  isMobile: boolean
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // En mobile, el sidebar está colapsado por defecto
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Persistir estado del sidebar en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null && !isMobile) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [isMobile])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    if (!isMobile) {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
    }
  }

  return <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isMobile }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
