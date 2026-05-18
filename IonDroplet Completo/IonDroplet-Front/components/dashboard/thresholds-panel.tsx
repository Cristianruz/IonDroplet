"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Settings, ChevronDown, ChevronUp, Save } from "lucide-react"

export interface Thresholds {
  tempMax: number
  humMax: number
  voltMin: number
  voltMax: number
  currMax: number
}

interface ThresholdsPanelProps {
  thresholds: Thresholds
  onThresholdsChange: (thresholds: Thresholds) => void
}

const DEFAULT_THRESHOLDS: Thresholds = {
  tempMax: 35,
  humMax: 80,
  voltMin: 11.4,
  voltMax: 12.9,
  currMax: 2.6,
}

export function ThresholdsPanel({ thresholds, onThresholdsChange }: ThresholdsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localThresholds, setLocalThresholds] = useState<Thresholds>(thresholds)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalThresholds(thresholds)
  }, [thresholds])

  const handleSave = () => {
    onThresholdsChange(localThresholds)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setLocalThresholds(DEFAULT_THRESHOLDS)
    onThresholdsChange(DEFAULT_THRESHOLDS)
  }

  const updateThreshold = (key: keyof Thresholds, value: string) => {
    const numValue = parseFloat(value) || 0
    setLocalThresholds(prev => ({ ...prev, [key]: numValue }))
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader 
        className="cursor-pointer pb-3" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            Umbrales de Alerta
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>

      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Temperatura Max */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Temp. Maxima (°C)</label>
              <Input
                type="number"
                value={localThresholds.tempMax}
                onChange={(e) => updateThreshold("tempMax", e.target.value)}
                className="h-9 font-mono text-sm"
              />
            </div>

            {/* Humedad Max */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Humedad Maxima (%)</label>
              <Input
                type="number"
                value={localThresholds.humMax}
                onChange={(e) => updateThreshold("humMax", e.target.value)}
                className="h-9 font-mono text-sm"
              />
            </div>

            {/* Corriente Max */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Corriente Maxima (A)</label>
              <Input
                type="number"
                step="0.1"
                value={localThresholds.currMax}
                onChange={(e) => updateThreshold("currMax", e.target.value)}
                className="h-9 font-mono text-sm"
              />
            </div>

            {/* Voltaje Min */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Voltaje Minimo (V)</label>
              <Input
                type="number"
                value={localThresholds.voltMin}
                onChange={(e) => updateThreshold("voltMin", e.target.value)}
                className="h-9 font-mono text-sm"
              />
            </div>

            {/* Voltaje Max */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Voltaje Maximo (V)</label>
              <Input
                type="number"
                value={localThresholds.voltMax}
                onChange={(e) => updateThreshold("voltMax", e.target.value)}
                className="h-9 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleSave}
              size="sm"
              className={cn(
                "gap-1.5 transition-colors",
                saved && "bg-success hover:bg-success"
              )}
            >
              <Save className="h-3.5 w-3.5" />
              {saved ? "Guardado" : "Guardar"}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              Restaurar
            </Button>
            <p className="ml-auto text-[10px] text-muted-foreground">
              Los umbrales se muestran como lineas en los graficos
            </p>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

export { DEFAULT_THRESHOLDS }
