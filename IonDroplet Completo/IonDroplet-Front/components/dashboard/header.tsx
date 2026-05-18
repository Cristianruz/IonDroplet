"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Power, RefreshCw, Droplets, Sprout } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

interface HeaderProps {
  systemPower: boolean
  onTogglePower: () => void
  pumpState?: boolean
  onTogglePump?: () => void
  lastUpdate: Date
}

export function Header({ systemPower, onTogglePower, pumpState, onTogglePump, lastUpdate }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setIsRefreshing(true)
    const timer = setTimeout(() => setIsRefreshing(false), 500)
    return () => clearTimeout(timer)
  }, [lastUpdate])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white overflow-hidden p-0.5">
            <Image src="/logo.png" alt="IonDroplet Logo" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">IonDroplet</h1>
            <p className="text-xs text-muted-foreground">Panel de Monitoreo</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <RefreshCw
              className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
            />
            <span className="font-mono text-xs">
              {mounted ? lastUpdate.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }) : "--:--:--"}
            </span>
          </div>
          <Link href="/cultivo" className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary sm:flex">
            <Sprout className="h-3.5 w-3.5" />
            Cultivo
          </Link>
          <div className="hidden h-4 w-px bg-border sm:block" />

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                systemPower ? "animate-ping bg-success" : "bg-muted-foreground"
              )} />
              <span className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                systemPower ? "bg-success" : "bg-muted-foreground"
              )} />
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {systemPower ? "En linea" : "Desconectado"}
            </span>
          </div>

          <Button
            variant={systemPower ? "default" : "outline"}
            size="sm"
            onClick={onTogglePower}
            className={cn(
              "h-8 gap-2 rounded-lg text-xs font-medium transition-all",
              systemPower
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <Power className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{systemPower ? "Encendido" : "Apagado"}</span>
          </Button>

          {onTogglePump && (
            <Button
              variant={pumpState ? "default" : "outline"}
              size="sm"
              onClick={onTogglePump}
              className={cn(
                "h-8 gap-2 rounded-lg text-xs font-medium transition-all",
                pumpState
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <Droplets className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{pumpState ? "Regando" : "Regar"}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
