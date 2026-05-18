"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertTriangle, AlertCircle, Info, X, Bell, CheckCircle } from "lucide-react"
import type { Alert } from "@/hooks/use-sensor-data"

interface AlertsPanelProps {
  alerts: Alert[]
  onDismiss: (id: string) => void
}

const alertConfig = {
  critical: {
    icon: AlertCircle,
    bg: "bg-destructive/5",
    text: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning/5",
    text: "text-warning",
  },
  info: {
    icon: Info,
    bg: "bg-primary/5",
    text: "text-primary",
  },
}

export function AlertsPanel({ alerts, onDismiss }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Alertas Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">Todo Normal</p>
          <p className="mt-1 text-xs text-muted-foreground">No hay alertas en este momento</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Bell className="h-4 w-4 text-muted-foreground" />
          Alertas Recientes
        </CardTitle>
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
          {alerts.length} activa{alerts.length !== 1 ? "s" : ""}
        </span>
      </CardHeader>
      <CardContent className="max-h-[280px] overflow-y-auto p-0">
        <div className="divide-y divide-border">
          {alerts.map((alert) => {
            const config = alertConfig[alert.type]
            const Icon = config.icon

            return (
              <div
                key={alert.id}
                className={cn("flex items-start gap-3 p-4", config.bg)}
              >
                <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", config.text)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={cn("text-sm font-medium", config.text)}>{alert.title}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 flex-shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onDismiss(alert.id)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Descartar alerta</span>
                    </Button>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{alert.message}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                    {alert.timestamp.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
