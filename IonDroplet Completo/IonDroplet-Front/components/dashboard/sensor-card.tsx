"use client"

import { cn } from "@/lib/utils"
import { Thermometer, Droplets, Zap, Activity, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import type { Thresholds } from "./thresholds-panel"

type SensorStatus = "good" | "warning" | "critical" | "idle"

interface SensorCardProps {
  type: "temperature" | "humidity" | "voltage" | "current"
  value: number
  unit: string
  status: SensorStatus
  thresholds?: Thresholds
  className?: string
}

const iconMap = {
  temperature: Thermometer,
  humidity: Droplets,
  voltage: Zap,
  current: Activity,
}

const labelMap = {
  temperature: "Temperatura",
  humidity: "Humedad",
  voltage: "Voltaje",
  current: "Corriente",
}

const statusConfig = {
  good: {
    border: "border-border",
    text: "text-foreground",
    label: "Normal",
    labelBg: "bg-success/10 text-success",
  },
  warning: {
    border: "border-warning/50",
    text: "text-warning",
    label: "Aviso",
    labelBg: "bg-warning/10 text-warning",
  },
  critical: {
    border: "border-destructive/50",
    text: "text-destructive",
    label: "Critico",
    labelBg: "bg-destructive/10 text-destructive",
  },
  idle: {
    border: "border-border",
    text: "text-muted-foreground",
    label: "Sin datos",
    labelBg: "bg-muted text-muted-foreground",
  },
}

function checkThresholdExceeded(
  type: SensorCardProps["type"],
  value: number,
  thresholds?: Thresholds
): boolean {
  if (!thresholds) return false
  switch (type) {
    case "temperature":
      return value > thresholds.tempMax
    case "humidity":
      return value > thresholds.humMax
    case "voltage":
      return value < thresholds.voltMin || value > thresholds.voltMax
    case "current":
      return value > thresholds.currMax
    default:
      return false
  }
}

export function SensorCard({ type, value, unit, status, thresholds, className }: SensorCardProps) {
  const Icon = iconMap[type]
  const label = labelMap[type]

  // Si no hay lectura del sensor, mostrar estado neutral en vez de "Critico"
  const effectiveStatus: SensorStatus = value === 0 ? "idle" : status
  const config = statusConfig[effectiveStatus]

  const thresholdExceeded =
    effectiveStatus !== "idle" && checkThresholdExceeded(type, value, thresholds)

  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    const startValue = displayValue
    const endValue = value
    const duration = 300
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * easeOut

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  const formatValue = (val: number) => {
    if (type === "current") return val.toFixed(2)
    if (type === "temperature") return val.toFixed(0)
    return val.toFixed(1)
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-md",
        thresholdExceeded ? "border-destructive/50" : config?.border ?? "",
        className
      )}
    >
      {/* Badge de umbral excedido */}
      {thresholdExceeded && (
        <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive">
          <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", config.labelBg)}>
          {config.label}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className={cn(
            "font-mono text-3xl font-semibold tabular-nums",
            thresholdExceeded ? "text-destructive" : config.text
          )}>
            {formatValue(displayValue)}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  )
}