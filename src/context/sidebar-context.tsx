"use client"

import type React from "react"
import { createContext, useState, useEffect } from "react"

export interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  isMobile: boolean
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      if (mobile && !isCollapsed) {
        setIsCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isCollapsed])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    
    if (!isMobile) {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
    }
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}