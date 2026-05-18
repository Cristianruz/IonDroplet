"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Zap, TrendingUp } from "lucide-react"

interface EnergyCardProps {
  voltage: number
  current: number
}

// Tarifa configurable MXN/kWh
const TARIFA_KWH = 2.5

// Umbrales de watts
const WATTS_SAFE = 500
const WATTS_WARNING = 800

export function EnergyCard({ voltage, current }: EnergyCardProps) {
  const [watts, setWatts] = useState(0)
  const [kwhToday, setKwhToday] = useState(0)
  const [wattHistory, setWattHistory] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastUpdateRef = useRef<Date>(new Date())

  // Calcular watts en tiempo real
  useEffect(() => {
    const currentWatts = voltage * current
    setWatts(currentWatts)

    // Calcular kWh acumulado
    const now = new Date()
    const timeDiffHours = (now.getTime() - lastUpdateRef.current.getTime()) / (1000 * 60 * 60)
    const kwhIncrement = (currentWatts / 1000) * timeDiffHours
    
    // Reiniciar a medianoche
    if (now.getDate() !== lastUpdateRef.current.getDate()) {
      setKwhToday(0)
    } else {
      setKwhToday(prev => prev + kwhIncrement)
    }
    
    lastUpdateRef.current = now

    // Agregar al historial (ultimas 60 lecturas)
    setWattHistory(prev => [...prev.slice(-59), currentWatts])
  }, [voltage, current])

  // Dibujar sparkline en canvas
  const drawSparkline = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || wattHistory.length < 2) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 2

    ctx.clearRect(0, 0, width, height)

    const maxWatt = Math.max(...wattHistory, WATTS_WARNING)
    const minWatt = Math.min(...wattHistory, 0)
    const range = maxWatt - minWatt || 1

    const points = wattHistory.map((w, i) => ({
      x: padding + (i / (wattHistory.length - 1)) * (width - padding * 2),
      y: height - padding - ((w - minWatt) / range) * (height - padding * 2)
    }))

    // Gradiente de fondo
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, "rgba(14, 165, 233, 0.3)")
    gradient.addColorStop(1, "rgba(14, 165, 233, 0)")

    // Dibujar area
    ctx.beginPath()
    ctx.moveTo(points[0].x, height)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Dibujar linea
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = "#0ea5e9"
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [wattHistory])

  useEffect(() => {
    drawSparkline()
  }, [drawSparkline])

  const getWattStatus = () => {
    if (watts > WATTS_WARNING) return "critical"
    if (watts > WATTS_SAFE) return "warning"
    return "good"
  }

  const status = getWattStatus()
  const statusColors = {
    good: "text-success",
    warning: "text-warning",
    critical: "text-destructive"
  }

  const costoEstimado = kwhToday * TARIFA_KWH

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
            <Zap className="h-4 w-4 text-warning" />
          </div>
          Eficiencia Energetica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Potencia actual */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Potencia Actual</p>
            <p className={cn("font-mono text-3xl font-semibold tabular-nums", statusColors[status])}>
              {watts.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">W</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">V × A</p>
            <p className="font-mono text-sm text-muted-foreground">
              {voltage.toFixed(1)} × {current.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Sparkline */}
        <div className="rounded-lg bg-muted/30 p-2">
          <div className="mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Ultimas 60 lecturas</span>
          </div>
          <canvas
            ref={canvasRef}
            width={240}
            height={40}
            className="w-full"
            style={{ height: "40px" }}
          />
        </div>

        {/* Consumo del dia */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-[10px] text-muted-foreground">kWh Hoy</p>
            <p className="font-mono text-lg font-semibold">{kwhToday.toFixed(3)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-[10px] text-muted-foreground">Costo Est. (MXN)</p>
            <p className="font-mono text-lg font-semibold">${costoEstimado.toFixed(2)}</p>
          </div>
        </div>

        {/* Indicador de estado */}
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(
            "h-2 w-2 rounded-full",
            status === "good" && "bg-success",
            status === "warning" && "bg-warning",
            status === "critical" && "bg-destructive"
          )} />
          <span className="text-muted-foreground">
            {status === "good" && "Consumo normal"}
            {status === "warning" && "Consumo elevado"}
            {status === "critical" && "Consumo critico"}
          </span>
          <span className="ml-auto text-muted-foreground">
            Tarifa: ${TARIFA_KWH.toFixed(2)}/kWh
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
