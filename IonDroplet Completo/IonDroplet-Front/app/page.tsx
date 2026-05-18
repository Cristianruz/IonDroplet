"use client"

import { useState, useEffect } from "react"
import { useSensorData } from "@/hooks/use-sensor-data"
import { Header } from "@/components/dashboard/header"
import { SensorCard } from "@/components/dashboard/sensor-card"
import { SensorCharts } from "@/components/dashboard/sensor-charts"
import { IonizationPanel } from "@/components/dashboard/ionization-panel"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { DevicesPanel } from "@/components/dashboard/devices-panel"
import { WeatherCard } from "@/components/dashboard/weather-card"
import { EnergyCard } from "@/components/dashboard/energy-card"
import { ThresholdsPanel, type Thresholds } from "@/components/dashboard/thresholds-panel"
import { SensorHeatmap } from "@/components/dashboard/sensor-heatmap"
import { AIIonizationPanel } from "@/components/dashboard/ai-ionization-panel"
import { AIChat } from "@/components/dashboard/ai-chat"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const {
    sensorData,
    historicalData,
    systemStatus,
    alerts,
    devices,
    togglePower,
    toggleIonization,
    togglePump,
    toggleDeviceIonization,
    dismissAlert,
    getSensorStatus,
  } = useSensorData(3000)

  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const [thresholds, setThresholds] = useState<Thresholds>({
    tempMax: 35,
    humMax: 80,
    voltMin: 11.4,
    voltMax: 12.9,
    currMax: 2.6,
  })

  return (
    <div className={cn(
      "min-h-screen bg-background transition-opacity duration-500",
      !systemStatus.power && "opacity-60"
    )}>
      <Header
        systemPower={systemStatus.power}
        onTogglePower={togglePower}
        pumpState={systemStatus.pump}
        onTogglePump={togglePump}
        lastUpdate={sensorData.timestamp}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">

          {/* 1. Sensores */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-foreground">Lecturas de Sensores</h2>
                <p className="text-xs text-muted-foreground">Actualizacion automatica cada 3 segundos</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <span className="text-[10px] font-medium text-primary">EN VIVO</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SensorCard type="temperature" value={sensorData.temperature} unit="°C" status={getSensorStatus(sensorData.temperature, "temperature")} thresholds={thresholds} />
              <SensorCard type="humidity" value={sensorData.humidity} unit="%" status={getSensorStatus(sensorData.humidity, "humidity")} thresholds={thresholds} />
              <SensorCard type="voltage" value={sensorData.voltage} unit="V" status={getSensorStatus(sensorData.voltage, "voltage")} thresholds={thresholds} />
              <SensorCard type="current" value={sensorData.current} unit="A" status={getSensorStatus(sensorData.current, "current")} thresholds={thresholds} />
            </div>
          </section>

          {/* 2. Control IA + Chat */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-foreground">Inteligencia Artificial</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <AIIonizationPanel
                temperature={sensorData.temperature}
                humidity={sensorData.humidity}
                voltage={sensorData.voltage}
                current={sensorData.current}
                ionizationOn={systemStatus.ionization}
                onToggleIonization={toggleIonization}
              />
              <AIChat
                temperature={sensorData.temperature}
                humidity={sensorData.humidity}
                voltage={sensorData.voltage}
                current={sensorData.current}
                ionizationOn={systemStatus.ionization}
              />
            </div>
          </section>

          {/* 3. Control de Ionizacion + Alertas */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-foreground">Control y Alertas</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <IonizationPanel
                systemStatus={systemStatus}
                onToggleIonization={toggleIonization}
              />
              <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />
            </div>
          </section>

          {/* 4. Clima y Energia */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-foreground">Clima y Energia</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <WeatherCard
                interiorTemp={sensorData.temperature}
                interiorHumidity={sensorData.humidity}
              />
              <EnergyCard
                voltage={sensorData.voltage}
                current={sensorData.current}
              />
            </div>
          </section>

          {/* 5. Graficos */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-foreground">Datos en Tiempo Real</h2>
            <SensorCharts data={historicalData as any} thresholds={thresholds} />
          </section>

          {/* 6. Heatmap */}
          <section>
            <SensorHeatmap />
          </section>

          {/* 7. Dispositivos */}
          <section>
            <DevicesPanel
              devices={devices}
              onToggleDeviceIonization={toggleDeviceIonization}
            />
          </section>

          {/* 8. Umbrales */}
          <section>
            <ThresholdsPanel
              thresholds={thresholds}
              onThresholdsChange={setThresholds}
            />
          </section>

        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-xs text-muted-foreground">IonDroplet - Sistema de Monitoreo IoT</p>
          <p className="mt-1 text-[10px] text-muted-foreground/70">
            Ultima lectura: {mounted ? sensorData.timestamp.toLocaleString("es-ES") : "--/--/--"}
          </p>
        </div>
      </footer>
    </div>
  )
}