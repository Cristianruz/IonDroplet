"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts"
import type { Thresholds } from "./thresholds-panel"

interface DataPoint {
  time: string
  temperature: number
  humidity: number
  voltage: number
  current: number
}

interface SensorChartsProps {
  data: DataPoint[]
  thresholds?: Thresholds
}

export function SensorCharts({ data, thresholds }: SensorChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Temperatura y Humedad
          </CardTitle>
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Temp (°C)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-chart-2" />
              <span className="text-xs text-muted-foreground">Humedad (%)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[200px] w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "var(--color-foreground)" }}
                />
                {thresholds && (
                  <>
                    <ReferenceLine
                      y={thresholds.tempMax}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Max ${thresholds.tempMax}°C`,
                        fill: "#ef4444",
                        fontSize: 9,
                        position: "insideTopRight",
                      }}
                    />
                    <ReferenceLine
                      y={thresholds.humMax}
                      stroke="#a78bfa"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Max ${thresholds.humMax}%`,
                        fill: "#a78bfa",
                        fontSize: 9,
                        position: "insideBottomRight",
                      }}
                    />
                  </>
                )}
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--color-primary)"
                  strokeWidth={1.5}
                  fill="url(#tempGradient)"
                  animationDuration={300}
                />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke="var(--color-chart-2)"
                  strokeWidth={1.5}
                  fill="url(#humidityGradient)"
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Voltaje y Corriente
          </CardTitle>
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">Voltaje (V)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Corriente (A)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[200px] w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="voltage"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  domain={[180, 260]}
                />
                <YAxis
                  yAxisId="current"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  domain={[0, 6]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "var(--color-foreground)" }}
                />
                {thresholds && (
                  <>
                    <ReferenceLine
                      yAxisId="voltage"
                      y={thresholds.voltMax}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                    <ReferenceLine
                      yAxisId="voltage"
                      y={thresholds.voltMin}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                    <ReferenceLine
                      yAxisId="current"
                      y={thresholds.currMax}
                      stroke="#22c55e"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                  </>
                )}
                <Area
                  yAxisId="voltage"
                  type="monotone"
                  dataKey="voltage"
                  stroke="var(--color-warning)"
                  strokeWidth={1.5}
                  fill="url(#voltageGradient)"
                  animationDuration={300}
                />
                <Area
                  yAxisId="current"
                  type="monotone"
                  dataKey="current"
                  stroke="var(--color-success)"
                  strokeWidth={1.5}
                  fill="url(#currentGradient)"
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
