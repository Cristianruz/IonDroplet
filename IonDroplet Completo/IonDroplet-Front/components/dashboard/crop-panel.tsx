"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sprout, Search, Thermometer, Droplets, Zap, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

interface CropPanelProps {
  temperature: number
  humidity: number
  voltage: number
  current: number
  onActivarRiego?: () => void
}

interface CropInfo {
  nombre: string
  tipo: string
  tempMin: number
  tempMax: number
  humMin: number
  humMax: number
  descripcion: string
  cuidados: string
  riegoFrecuencia: string
  analisis: string
  etapaActual: string
  descripcionEtapa: string
  proximaEtapa: string
  diasProximaEtapa: number
}

const CULTIVOS_COMUNES = [
  "Tomate", "Chile", "Maíz", "Frijol", "Lechuga", "Pepino",
  "Calabaza", "Cebolla", "Ajo", "Sandía", "Melón", "Zanahoria",
  "Papa", "Fresa", "Mango", "Nogal"
]

export function CropPanel({ temperature, humidity, voltage, current, onActivarRiego }: CropPanelProps) {
  const [cultivo, setCultivo] = useState("")
  const [input, setInput] = useState("")
  const [cropInfo, setCropInfo] = useState<CropInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [riegoActivado, setRiegoActivado] = useState(false)
  const [riegoLoading, setRiegoLoading] = useState(false)

  const analizarCultivo = async (nombreCultivo: string) => {
    if (!nombreCultivo.trim()) return
    setLoading(true)
    setError("")
    setCultivo(nombreCultivo)
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          messages: [{
            role: "user",
            content: `Eres un experto agrónomo. Analiza el cultivo "${nombreCultivo}" con estos datos actuales de sensores:
- Temperatura: ${temperature.toFixed(1)}°C
- Humedad: ${humidity.toFixed(0)}%
- Voltaje del sistema: ${voltage.toFixed(1)}V
- Corriente: ${current.toFixed(2)}A

Responde SOLO en este formato JSON sin texto adicional:
{
  "nombre": "nombre del cultivo",
  "tipo": "Verdura|Fruta|Cereal|Legumbre|Hortaliza",
  "tempMin": número,
  "tempMax": número,
  "humMin": número,
  "humMax": número,
  "descripcion": "descripción breve del cultivo en 1 oración",
  "cuidados": "principales cuidados en 1 oración",
  "riegoFrecuencia": "frecuencia de riego recomendada",
  "analisis": "análisis de las condiciones actuales comparadas con las ideales, en 2-3 oraciones",
  "etapaActual": "etapa actual del ciclo según abril",
  "descripcionEtapa": "qué pasa en esta etapa en 1 oración",
  "proximaEtapa": "siguiente etapa del ciclo",
  "diasProximaEtapa": número de días estimados
}`
          }]
        })
      })
      const data = await response.json()
      const text = data.content[0].text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(text)
      setCropInfo(parsed)

      try {
        const token = localStorage.getItem('token') || ""
        await fetch('http://localhost:3001/api/thresholds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ temp_max: parsed.tempMax, hum_max: parsed.humMax, volt_min: 0, volt_max: 30, curr_max: 5 })
        })
      } catch (e) {
        console.error("Error updating thresholds:", e)
      }
    } catch {
      setError("No se pudo analizar el cultivo. Intenta de nuevo.")
    }
    setLoading(false)
  }

  const activarRiegoAutomatico = async () => {
    setRiegoLoading(true)
    try {
      const token = localStorage.getItem('token')
      await fetch('http://localhost:3001/api/ionization/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ state: true, device_id: 'bomba-riego' })
      })
      setRiegoActivado(true)
      if (onActivarRiego) onActivarRiego()
      setTimeout(() => setRiegoActivado(false), 30000)
    } catch { console.error('Error al activar riego') }
    setRiegoLoading(false)
  }

  const getTempStatus = () => {
    if (!cropInfo) return "normal"
    if (temperature < cropInfo.tempMin || temperature > cropInfo.tempMax) return "critical"
    if (temperature < cropInfo.tempMin + 2 || temperature > cropInfo.tempMax - 2) return "warning"
    return "good"
  }

  const getHumStatus = () => {
    if (!cropInfo) return "normal"
    if (humidity < cropInfo.humMin || humidity > cropInfo.humMax) return "critical"
    if (humidity < cropInfo.humMin + 5 || humidity > cropInfo.humMax - 5) return "warning"
    return "good"
  }

  const statusColor = (s: string) =>
    s === "good" ? "text-success" : s === "warning" ? "text-warning" : s === "critical" ? "text-destructive" : "text-muted-foreground"

  const statusBg = (s: string) =>
    s === "good" ? "bg-success/10 border-success/30" : s === "warning" ? "bg-warning/10 border-warning/30" : s === "critical" ? "bg-destructive/10 border-destructive/30" : "bg-muted/20 border-border"

  const statusIcon = (s: string) =>
    s === "good" ? <CheckCircle className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-destructive" />

  const getHealth = () => {
    if (!cropInfo) return 0
    const tempOk = temperature >= cropInfo.tempMin && temperature <= cropInfo.tempMax
    const humOk = humidity >= cropInfo.humMin && humidity <= cropInfo.humMax
    const tempScore = tempOk ? 50 : Math.max(0, 50 - Math.abs(temperature - (cropInfo.tempMin + cropInfo.tempMax) / 2) * 3)
    const humScore = humOk ? 50 : Math.max(0, 50 - Math.abs(humidity - (cropInfo.humMin + cropInfo.humMax) / 2) * 1.5)
    return Math.min(100, Math.round(tempScore + humScore))
  }

  return (
    <div className="space-y-6">

      {/* Buscador */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">¿Qué cultivo tienes?</h2>
          <p className="text-xs text-muted-foreground mt-1">Selecciona uno de la lista o escribe el nombre</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && analizarCultivo(input)}
            placeholder="Ej: Nogal, Tomate, Maíz..."
            className="flex-1 rounded-lg border border-border bg-muted/20 px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => analizarCultivo(input)}
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Analizando..." : "Analizar"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CULTIVOS_COMUNES.map(c => (
            <button key={c} onClick={() => { setInput(c); analizarCultivo(c) }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                cultivo === c ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}>
              {c}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {cropInfo && (
        <>
          {/* Info general */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sprout className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{cropInfo.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{cropInfo.tipo}</p>
                </div>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                Abril
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{cropInfo.descripcion}</p>
          </div>

          {/* Salud + Etapa en grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* Velocímetro */}
            {(() => {
              const health = getHealth()
              const color = health >= 70 ? "#22c55e" : health >= 40 ? "#f59e0b" : "#ef4444"
              const label = health >= 70 ? "Óptimo" : health >= 40 ? "En riesgo" : "Crítico"
              const angle = -180 + (health / 100) * 180
              const L = Math.PI * 75
              const nx = 90 + 60 * Math.cos((angle * Math.PI) / 180)
              const ny = 90 + 60 * Math.sin((angle * Math.PI) / 180)
              const sepAt = (pct: number) => {
                const a = (-180 + pct * 180) * Math.PI / 180
                return { x1: 90 + 67 * Math.cos(a), y1: 90 + 67 * Math.sin(a), x2: 90 + 83 * Math.cos(a), y2: 90 + 83 * Math.sin(a) }
              }
              const s40 = sepAt(0.4), s70 = sepAt(0.7)
              return (
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Salud del cultivo</p>
                  <div className="flex justify-center">
                    <svg width="180" height="130" viewBox="0 0 180 130">
                      {/* Track base */}
                      <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
                      {/* Zone tints */}
                      <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke="#ef4444" strokeWidth="18" strokeLinecap="butt" strokeDasharray={`${0.4 * L} ${L}`} opacity="0.25" />
                      <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="butt" strokeDasharray={`${0.3 * L} ${L}`} strokeDashoffset={`${-0.4 * L}`} opacity="0.25" />
                      <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke="#22c55e" strokeWidth="18" strokeLinecap="butt" strokeDasharray={`${0.3 * L} ${L}`} strokeDashoffset={`${-0.7 * L}`} opacity="0.25" />
                      {/* Active progress */}
                      <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" strokeDasharray={`${(health / 100) * L} ${L}`} />
                      {/* Zone separators */}
                      <line x1={s40.x1} y1={s40.y1} x2={s40.x2} y2={s40.y2} stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
                      <line x1={s70.x1} y1={s70.y1} x2={s70.x2} y2={s70.y2} stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
                      {/* Needle */}
                      <line x1="90" y1="90" x2={nx} y2={ny} stroke="white" strokeWidth="2" strokeLinecap="round" />
                      {/* Center pivot */}
                      <circle cx="90" cy="90" r="6" fill={color} />
                      <circle cx="90" cy="90" r="2.5" fill="white" />
                      {/* Value — below needle range (needle only goes up from y=90) */}
                      <text x="90" y="124" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold" fontFamily="monospace">{health}%</text>
                    </svg>
                  </div>
                  <p style={{ color }} className="text-sm font-semibold -mt-1">{label}</p>
                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground px-2">
                    <span>Crítico</span><span>En riesgo</span><span>Óptimo</span>
                  </div>
                </div>
              )
            })()}

            {/* Etapa */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <p className="text-xs font-medium text-muted-foreground">Etapa del ciclo de cultivo</p>
              <div>
                <p className="text-base font-bold text-primary">{cropInfo.etapaActual}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cropInfo.descripcionEtapa}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Etapa actual</span>
                  <span>{cropInfo.diasProximaEtapa} días → {cropInfo.proximaEtapa}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.round((30 - Math.min(30, cropInfo.diasProximaEtapa)) / 30 * 100))}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Riego: </span>
                  {cropInfo.riegoFrecuencia}
                </p>
              </div>
            </div>
          </div>

          {/* Sensores vs ideal */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold mb-4">Condiciones actuales vs ideal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={cn("rounded-lg border p-4 space-y-2", statusBg(getTempStatus()))}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Temperatura</span>
                  </div>
                  {statusIcon(getTempStatus())}
                </div>
                <p className={cn("font-mono text-2xl font-bold", statusColor(getTempStatus()))}>{temperature.toFixed(1)}°C</p>
                <p className="text-xs text-muted-foreground">Ideal: {cropInfo.tempMin}°C — {cropInfo.tempMax}°C</p>
              </div>
              <div className={cn("rounded-lg border p-4 space-y-2", statusBg(getHumStatus()))}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Humedad</span>
                  </div>
                  {statusIcon(getHumStatus())}
                </div>
                <p className={cn("font-mono text-2xl font-bold", statusColor(getHumStatus()))}>{humidity.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Ideal: {cropInfo.humMin}% — {cropInfo.humMax}%</p>
              </div>
            </div>
          </div>

          {/* Análisis IA */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Análisis IA</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{cropInfo.analisis}</p>
          </div>

          {/* Cuidados */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold mb-2">Cuidados recomendados</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{cropInfo.cuidados}</p>
          </div>

          {/* Riego automático */}
          {(humidity < cropInfo.humMin || riegoActivado) && (
            <div className={cn("rounded-xl border p-6 space-y-3",
              riegoActivado ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"
            )}>
              <div>
                <p className={cn("text-sm font-bold", riegoActivado ? "text-success" : "text-primary")}>
                  {riegoActivado ? "✓ Riego activado" : "💧 El cultivo necesita agua"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {riegoActivado
                    ? "La bomba está activa. Se desactivará en 30 segundos."
                    : `Humedad actual ${humidity.toFixed(0)}% — mínimo requerido para ${cropInfo.nombre}: ${cropInfo.humMin}%`
                  }
                </p>
              </div>
              {!riegoActivado && (
                <button onClick={activarRiegoAutomatico} disabled={riegoLoading}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                  {riegoLoading ? "Activando bomba..." : "Activar riego ahora"}
                </button>
              )}
            </div>
          )}

          {/* Alerta de riesgo */}
          {(() => {
            const health = getHealth()
            if (health >= 70) return null
            const isCritical = health < 40
            const acciones: { hoy: string, semana: string, mes: string }[] = []
            if (humidity < cropInfo.humMin) acciones.push({ hoy: "Aumentar riego inmediatamente", semana: "Revisar sistema de irrigación", mes: "Instalar sensor de humedad de suelo" })
            else if (humidity > cropInfo.humMax) acciones.push({ hoy: "Reducir riego hoy", semana: "Revisar drenaje del suelo", mes: "Evaluar sistema de drenaje" })
            if (temperature > cropInfo.tempMax) acciones.push({ hoy: "Aplicar sombreado parcial", semana: "Instalar malla sombra", mes: "Plantar árboles de sombra" })
            else if (temperature < cropInfo.tempMin) acciones.push({ hoy: "Cubrir cultivo con plástico", semana: "Revisar pronóstico de heladas", mes: "Considerar invernadero" })
            return (
              <div className={cn("rounded-xl border p-6 space-y-4", isCritical ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5")}>
                <p className={cn("text-sm font-bold", isCritical ? "text-destructive" : "text-warning")}>
                  {isCritical ? "⚠ Peligro crítico para el cultivo" : "⚡ Cultivo en riesgo — actúa pronto"}
                </p>
                {acciones.map((a, i) => (
                  <div key={i} className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/20 p-3 text-center space-y-1">
                      <p className="text-[10px] text-muted-foreground font-medium">HOY</p>
                      <p className="text-xs font-medium text-foreground">{a.hoy}</p>
                    </div>
                    <div className="rounded-lg bg-muted/20 p-3 text-center space-y-1">
                      <p className="text-[10px] text-muted-foreground font-medium">ESTA SEMANA</p>
                      <p className="text-xs font-medium text-foreground">{a.semana}</p>
                    </div>
                    <div className="rounded-lg bg-muted/20 p-3 text-center space-y-1">
                      <p className="text-[10px] text-muted-foreground font-medium">ESTE MES</p>
                      <p className="text-xs font-medium text-foreground">{a.mes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Predicción */}
          {(() => {
            const tempTrend = temperature > cropInfo.tempMax ? "alto" : temperature < cropInfo.tempMin ? "bajo" : "estable"
            const humTrend = humidity < cropInfo.humMin ? "bajo" : humidity > cropInfo.humMax ? "alto" : "estable"
            const predTemp = tempTrend === "alto" ? `En 3 días la temperatura podría causar estrés térmico en el ${cropInfo.nombre}.`
              : tempTrend === "bajo" ? `En 3 días las bajas temperaturas podrían afectar el crecimiento.`
                : `La temperatura se mantiene estable y favorable.`
            const predHum = humTrend === "bajo" ? `Si la humedad sigue bajando, en 2-3 días el cultivo entrará en estrés hídrico.`
              : humTrend === "alto" ? `El exceso de humedad puede provocar hongos en los próximos días.`
                : `La humedad está en rango óptimo, mantener el riego actual.`
            const riesgo = tempTrend !== "estable" && humTrend !== "estable"
            return (
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-semibold">📈 Predicción próximos 3 días</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", tempTrend === "estable" ? "bg-success" : "bg-warning")} />
                    <p className="text-sm text-muted-foreground leading-relaxed">{predTemp}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", humTrend === "estable" ? "bg-success" : "bg-destructive")} />
                    <p className="text-sm text-muted-foreground leading-relaxed">{predHum}</p>
                  </div>
                </div>
                {riesgo && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm text-destructive font-medium">
                      ⚠ Combinación crítica detectada — temperatura y humedad fuera de rango simultáneamente. Alta probabilidad de pérdida del cultivo si no se actúa en 48 horas.
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Botón re-analizar */}
          <button onClick={() => analizarCultivo(cultivo)} disabled={loading}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50 flex items-center justify-center gap-2">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {loading ? "Analizando..." : "Re-analizar con datos actuales"}
          </button>
        </>
      )}
    </div>
  )
}