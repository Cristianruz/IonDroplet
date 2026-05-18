"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Cpu, Wifi, WifiOff, Battery, MapPin } from "lucide-react"
import type { Device } from "@/hooks/use-sensor-data"

interface DevicesPanelProps {
  devices: Device[]
  onToggleDeviceIonization: (deviceId: string) => void
}

export function DevicesPanel({ devices, onToggleDeviceIonization }: DevicesPanelProps) {
  const onlineCount = devices.filter((d) => d.status === "online").length

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          Estado de Dispositivos
        </CardTitle>
        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
          {onlineCount}/{devices.length} en linea
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {devices.map((device) => (
            <div
              key={device.id}
              className={cn(
                "flex items-center justify-between gap-4 px-6 py-4 transition-colors",
                device.status === "offline" && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  device.status === "online"
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                )}>
                  {device.status === "online" ? (
                    <Wifi className="h-4 w-4" />
                  ) : (
                    <WifiOff className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{device.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono">{device.ip}</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {device.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  device.battery > 60
                    ? "bg-success/10 text-success"
                    : device.battery > 30
                      ? "bg-warning/10 text-warning"
                      : "bg-destructive/10 text-destructive"
                )}>
                  <Battery className="h-3 w-3" />
                  {Math.round(device.battery)}%
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden text-[11px] text-muted-foreground sm:inline">Ion</span>
                  <Switch
                    checked={device.ionizationEnabled}
                    onCheckedChange={() => onToggleDeviceIonization(device.id)}
                    disabled={device.status === "offline"}
                    className="scale-90 data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
