"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Grid3X3, TrendingDown, TrendingUp, Activity } from "lucide-react"

type SensorType = "temp" | "hum" | "volt" | "curr"

interface HeatmapCell {
  day: number
  hour: number
  value: number
}

interface SensorHeatmapProps {
  className?: string
}

// Generar datos de prueba para 7 dias x 24 horas
function generateMockData(): Record<SensorType, HeatmapCell[]> {
  const data: Record<SensorType, HeatmapCell[]> = {
    temp: [],
    hum: [],
    volt: [],
    curr: [],
  }

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Temperatura: mas alta en la tarde
      const tempBase = 22 + Math.sin((hour - 6) * Math.PI / 12) * 6
      data.temp.push({ day, hour, value: tempBase + Math.random() * 3 })

      // Humedad: mas alta en la noche
      const humBase = 60 + Math.cos((hour - 12) * Math.PI / 12) * 15
      data.hum.push({ day, hour, value: humBase + Math.random() * 10 })

      // Voltaje: estable con variaciones menores
      data.volt.push({ day, hour, value: 11.4 + Math.random() * 1.5 })

      // Corriente: mas alta durante el dia
      const currBase = hour >= 8 && hour <= 20 ? 2.3 : 2.0
data.curr.push({ day, hour, value: currBase + Math.random() * 0.3 })
    }
  }

  return data
}

const sensorConfig: Record<SensorType, { label: string; unit: string; colors: string[] }> = {
  temp: {
    label: "Temperatura",
    unit: "°C",
    colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#fcd34d", "#f97316", "#ef4444", "#b91c1c", "#7f1d1d"],
  },
  hum: {
    label: "Humedad",
    unit: "%",
    colors: ["#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3"],
  },
  volt: {
    label: "Voltaje",
    unit: "V",
    colors: ["#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534"],
  },
  curr: {
    label: "Corriente",
    unit: "A",
    colors: ["#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e"],
  },
}

const DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

export function SensorHeatmap({ className }: SensorHeatmapProps) {
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temp")
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; value: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const mockData = useMemo(() => generateMockData(), [])
  const data = mockData[selectedSensor]
  const config = sensorConfig[selectedSensor]

  const getColorForValue = useCallback((value: number) => {
    const values = data.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const normalized = (value - min) / range
    const colorIndex = Math.min(Math.floor(normalized * config.colors.length), config.colors.length - 1)
    return config.colors[colorIndex]
  }, [data, config.colors])

  const stats = useMemo(() => {
    const values = data.map(d => d.value)
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }
  }, [data])

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Grid3X3 className="h-4 w-4 text-primary" />
            </div>
            Mapa de Calor Semanal
          </div>
          <div className="flex gap-1">
            {(Object.keys(sensorConfig) as SensorType[]).map((sensor) => (
              <Button
                key={sensor}
                variant={selectedSensor === sensor ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedSensor(sensor)}
                className="h-7 px-2 text-[10px] font-medium"
              >
                {sensor.toUpperCase()}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Horas header */}
            <div className="mb-1 flex gap-0.5 pl-10">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex-1 text-center text-[8px] text-muted-foreground">
                  {i % 6 === 0 ? `${i}h` : ""}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {mounted ? DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-0.5">
                <div className="w-10 text-right text-[10px] text-muted-foreground pr-2">{day}</div>
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = data.find(d => d.day === dayIndex && d.hour === hour)
                  const value = cell?.value ?? 0
                  return (
                    <div
                      key={hour}
                      className="relative h-5 flex-1 cursor-pointer rounded-sm transition-transform hover:scale-110 hover:z-10"
                      style={{ backgroundColor: getColorForValue(value) }}
                      onMouseEnter={() => setHoveredCell({ day: dayIndex, hour, value })}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  )
                })}
              </div>
            )) : (
              <div className="h-[150px] w-full animate-pulse bg-muted/20 rounded-md"></div>
            )}
          </div>
        </div>

        {/* Tooltip */}
        {hoveredCell && (
          <div className="rounded-lg border border-border bg-popover p-2 text-xs">
            <span className="font-medium">{DAYS[hoveredCell.day]}</span>
            <span className="text-muted-foreground"> a las </span>
            <span className="font-medium">{hoveredCell.hour}:00</span>
            <span className="text-muted-foreground"> - </span>
            <span className="font-mono font-semibold">
              {hoveredCell.value.toFixed(1)} {config.unit}
            </span>
          </div>
        )}

        {/* Stats */}
        {mounted && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
              <TrendingDown className="mx-auto h-4 w-4 text-success" />
              <p className="mt-1 font-mono text-lg font-semibold">{stats.min.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Minimo ({config.unit})</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
              <Activity className="mx-auto h-4 w-4 text-primary" />
              <p className="mt-1 font-mono text-lg font-semibold">{stats.avg.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Promedio ({config.unit})</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
              <TrendingUp className="mx-auto h-4 w-4 text-destructive" />
              <p className="mt-1 font-mono text-lg font-semibold">{stats.max.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Maximo ({config.unit})</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] text-muted-foreground">Bajo</span>
          <div className="flex h-2 w-32 overflow-hidden rounded-full">
            {config.colors.map((color, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">Alto</span>
        </div>
      </CardContent>
    </Card>
  )
}
