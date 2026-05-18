"use client"

import { useSensorData } from "@/hooks/use-sensor-data"
import { CropPanel } from "@/components/dashboard/crop-panel"
import { Sprout, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CultivoPage() {
  const { sensorData } = useSensorData(3000)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Sprout className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">Análisis de Cultivo</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] font-medium text-primary">Sensores en vivo</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Selecciona tu cultivo</h1>
          <p className="text-xs text-muted-foreground mt-1">
            La IA analizará las condiciones actuales de tus sensores y te dará recomendaciones personalizadas para tu cultivo.
          </p>
        </div>

        <CropPanel
          temperature={sensorData.temperature}
          humidity={sensorData.humidity}
          voltage={sensorData.voltage}
          current={sensorData.current}
        />
      </main>
    </div>
  )
}