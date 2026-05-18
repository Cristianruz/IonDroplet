"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Brain, Zap, RefreshCw, Power, Clock, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"

interface AIIonizationPanelProps {
  temperature: number
  humidity: number
  voltage: number
  current: number
  exteriorHumidity?: number
  ionizationOn: boolean
  onToggleIonization: () => void
}

interface AIAnalysis {
  recommendation: "encender" | "apagar" | "mantener"
  reason: string
  confidence: number
  action: boolean
  mainFactor: string
  detail: string
}

interface HistoryEntry {
  recommendation: "encender" | "apagar" | "mantener"
  reason: string
  confidence: number
  mainFactor: string
  timestamp: string
}

export function AIIonizationPanel({
  temperature,
  humidity,
  voltage,
  current,
  exteriorHumidity = 0,
  ionizationOn,
  onToggleIonization,
}: AIIonizationPanelProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<string>("")
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [totalAnalyses, setTotalAnalyses] = useState(0)
  const [lastEncendido, setLastEncendido] = useState<string>("")

  const analyzeWithAI = async () => {
    setLoading(true)
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
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: `Eres el sistema de control de un ionizador de agua. Analiza estos datos y decide si encender o apagar la ionización.

Datos actuales:
- Temperatura interior: ${temperature.toFixed(1)}°C
- Humedad interior: ${humidity.toFixed(0)}%
- Humedad exterior: ${exteriorHumidity}%
- Voltaje: ${voltage.toFixed(1)}V
- Corriente: ${current.toFixed(2)}A
- Ionización actualmente: ${ionizationOn ? "ENCENDIDA" : "APAGADA"}

Responde SOLO en este formato JSON sin texto adicional:
{"recommendation":"encender|apagar|mantener","reason":"explicación breve en español de máximo 15 palabras","confidence":0-100,"action":true|false,"mainFactor":"nombre del sensor más importante para esta decisión","detail":"explicación más detallada en español de 2-3 oraciones sobre por qué tomaste esta decisión y qué podría pasar si no se sigue"}`
            }
          ]
        })
      })

      const data = await response.json()
      const text = data.content[0].text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim()
      const parsed: AIAnalysis = JSON.parse(text)
      setAnalysis(parsed)
      const time = new Date().toLocaleTimeString("es-ES")
      setLastAnalysis(time)
      setTotalAnalyses(prev => prev + 1)

      if (parsed.recommendation === "encender") {
        setLastEncendido(time)
      }

      setHistory(prev => [{
        recommendation: parsed.recommendation,
        reason: parsed.reason,
        confidence: parsed.confidence,
        mainFactor: parsed.mainFactor,
        timestamp: time
      }, ...prev].slice(0, 5))

      if (autoMode) {
        if (parsed.action && !ionizationOn) onToggleIonization()
        if (!parsed.action && ionizationOn) onToggleIonization()
      }
    } catch {
      setAnalysis({
        recommendation: "mantener",
        reason: "Error al conectar con la IA.",
        confidence: 0,
        action: ionizationOn,
        mainFactor: "—",
        detail: "No se pudo conectar con el servidor de IA. Verifica tu conexión."
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!autoMode) return
    analyzeWithAI()
    const interval = setInterval(analyzeWithAI, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [autoMode])

  const recColor = analysis?.recommendation === "encender"
    ? "text-success"
    : analysis?.recommendation === "apagar"
    ? "text-destructive"
    : "text-warning"

  const recBorder = analysis?.recommendation === "encender"
    ? "border-success/30 bg-success/5"
    : analysis?.recommendation === "apagar"
    ? "border-destructive/30 bg-destructive/5"
    : "border-warning/30 bg-warning/5"

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            Control IA — Ionización
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Auto</span>
            <button
              onClick={(e) => { e.stopPropagation(); setAutoMode(!autoMode) }}
              style={{
                position: 'relative', width: '36px', height: '20px',
                borderRadius: '10px', border: 'none', cursor: 'pointer',
                backgroundColor: autoMode ? '#0ea5e9' : '#374151',
                transition: 'background-color 0.2s', flexShrink: 0, display: 'inline-block',
              }}
            >
              <span style={{
                position: 'absolute', top: '2px', left: autoMode ? '18px' : '2px',
                width: '16px', height: '16px', borderRadius: '50%',
                backgroundColor: 'white', transition: 'left 0.2s', display: 'block',
              }} />
            </button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Estado actual */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <Power className={cn("h-4 w-4", ionizationOn ? "text-success" : "text-muted-foreground")} />
            <span className="text-xs font-medium">
              Ionización {ionizationOn ? "encendida" : "apagada"}
            </span>
          </div>
          {autoMode && <span className="text-[10px] text-primary">Modo automático activo</span>}
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-muted/10 p-2 text-center">
            <TrendingUp className="mx-auto h-3 w-3 text-primary mb-1" />
            <p className="font-mono text-sm font-semibold">{totalAnalyses}</p>
            <p className="text-[9px] text-muted-foreground">Análisis hoy</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/10 p-2 text-center">
            <Clock className="mx-auto h-3 w-3 text-muted-foreground mb-1" />
            <p className="font-mono text-[10px] font-semibold">{lastAnalysis || "—"}</p>
            <p className="text-[9px] text-muted-foreground">Último análisis</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/10 p-2 text-center">
            <Zap className="mx-auto h-3 w-3 text-warning mb-1" />
            <p className="font-mono text-[10px] font-semibold">{lastEncendido || "—"}</p>
            <p className="text-[9px] text-muted-foreground">Último encendido</p>
          </div>
        </div>

        {/* Resultado del análisis */}
        {analysis && (
          <div className={cn("rounded-lg border p-3 space-y-3", recBorder)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className={cn("h-3.5 w-3.5", recColor)} />
                <span className={cn("text-xs font-semibold capitalize", recColor)}>
                  Recomendación: {analysis.recommendation}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {analysis.confidence}% confianza
              </span>
            </div>

            {/* Barra de confianza */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all",
                  analysis.recommendation === "encender" ? "bg-success" :
                  analysis.recommendation === "apagar" ? "bg-destructive" : "bg-warning"
                )}
                style={{ width: `${analysis.confidence}%` }}
              />
            </div>

            {/* Razón breve */}
            <p className="text-xs text-muted-foreground">{analysis.reason}</p>

            {/* Factor principal */}
            <div className="flex items-center gap-2 rounded-md bg-muted/30 px-2 py-1.5">
              <AlertCircle className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground">Factor principal:</span>
              <span className="text-[10px] font-medium text-foreground">{analysis.mainFactor}</span>
            </div>

            {/* Detalle expandido */}
            <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
              {analysis.detail}
            </p>
          </div>
        )}

        {/* Historial */}
        {history.length > 0 && (
          <div className="rounded-lg border border-border">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex w-full items-center justify-between px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Historial de análisis ({history.length})</span>
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showHistory && (
              <div className="border-t border-border divide-y divide-border">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0",
                        h.recommendation === "encender" ? "bg-success" :
                        h.recommendation === "apagar" ? "bg-destructive" : "bg-warning"
                      )} />
                      <span className="text-[10px] text-foreground capitalize">{h.recommendation}</span>
                      <span className="text-[10px] text-muted-foreground">— {h.reason}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground flex-shrink-0 ml-2">{h.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          <Button
            onClick={analyzeWithAI}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {loading ? "Analizando..." : "Analizar ahora"}
          </Button>
          {!autoMode && analysis && (
            <Button
              onClick={onToggleIonization}
              size="sm"
              className="flex-1 gap-1.5"
              variant={analysis.recommendation === "encender" ? "default" : "destructive"}
            >
              <Power className="h-3.5 w-3.5" />
              {analysis.recommendation === "encender" ? "Encender" : "Apagar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}