"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Zap, Clock, RefreshCw, Battery } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import type { SystemStatus } from "@/hooks/use-sensor-data"

interface IonizationPanelProps {
  systemStatus: SystemStatus
  onToggleIonization: () => void
}

// Potencia del ionizador en watts (configurable)
const IONIZER_WATTS = 15

// Datos simulados de historial semanal
function generateWeeklyHistory() {
  const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
  return days.map((day) => ({
    day,
    horas: Math.random() * 8 + 2,
    ciclos: Math.floor(Math.random() * 10) + 1,
  }))
}

export function IonizationPanel({ systemStatus, onToggleIonization }: IonizationPanelProps) {
  const isActive = systemStatus.ionization
  const isPowered = systemStatus.power

  const [hoursActiveToday, setHoursActiveToday] = useState(0)
  const [cyclesToday, setCyclesToday] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)

  const weeklyHistory = useMemo(() => generateWeeklyHistory(), [])

  // Contador de tiempo activo
  useEffect(() => {
    if (isActive) {
      if (!startTime) {
        setStartTime(new Date())
        setCyclesToday((prev) => prev + 1)
      }
    } else {
      if (startTime) {
        const elapsed = (Date.now() - startTime.getTime()) / (1000 * 60 * 60)
        setHoursActiveToday((prev) => prev + elapsed)
        setStartTime(null)
      }
    }
  }, [isActive, startTime])

  // Actualizar contador cada minuto mientras esta activo
  useEffect(() => {
    if (!isActive || !startTime) return
    const interval = setInterval(() => {
      // forzar re-render
      setStartTime((prev) => prev ? new Date(prev.getTime()) : null)
    }, 60000)
    return () => clearInterval(interval)
  }, [isActive, startTime])

  const currentHours = startTime
    ? hoursActiveToday + (Date.now() - startTime.getTime()) / (1000 * 60 * 60)
    : hoursActiveToday

  const energyConsumed = (currentHours * IONIZER_WATTS) / 1000 // kWh

  return (
    <Card
      className={cn(
        "border transition-all duration-300",
        isActive ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {isActive && (
              <span className="absolute inset-0 animate-ping rounded-lg bg-primary/30" />
            )}
            <Zap className="relative h-4 w-4" />
          </div>
          Control de Ionizacion
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estado */}
        <div>
          <p className="text-xs text-muted-foreground">Estado del Sistema</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isActive && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  isActive ? "bg-primary" : "bg-muted-foreground"
                )}
              />
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        {!isPowered && (
          <p className="text-center text-xs text-destructive">
            El sistema debe estar encendido para controlar la ionizacion
          </p>
        )}

        {/* Estadisticas del dia */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-muted/20 p-2 text-center">
            <Clock className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
            <p className="mt-1 font-mono text-sm font-semibold">
              {currentHours.toFixed(1)}h
            </p>
            <p className="text-[9px] text-muted-foreground">Hoy</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-2 text-center">
            <RefreshCw className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
            <p className="mt-1 font-mono text-sm font-semibold">{cyclesToday}</p>
            <p className="text-[9px] text-muted-foreground">Ciclos</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-2 text-center">
            <Battery className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
            <p className="mt-1 font-mono text-sm font-semibold">
              {energyConsumed.toFixed(3)}
            </p>
            <p className="text-[9px] text-muted-foreground">kWh</p>
          </div>
        </div>

        {/* Ultimo cambio */}
        {systemStatus.ionizationLastChanged && (
          <p className="text-center text-[10px] text-muted-foreground">
            Ultimo cambio:{" "}
            <span className="font-mono">
              {systemStatus.ionizationLastChanged.toLocaleString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </p>
        )}

        {/* Grafico semanal */}
        <div>
          <p className="mb-2 text-[10px] text-muted-foreground">
            Horas activas por dia (ultimos 7 dias)
          </p>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    fontSize: "10px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}h`, "Horas"]}
                />
                <Bar dataKey="horas" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Potencia del ionizador: {IONIZER_WATTS}W
        </p>
      </CardContent>
    </Card>
  )
}
