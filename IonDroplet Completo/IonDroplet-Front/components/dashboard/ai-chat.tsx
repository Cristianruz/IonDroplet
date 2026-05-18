"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MessageCircle, Send, Bot, User } from "lucide-react"

interface AIChatProps {
  temperature: number
  humidity: number
  voltage: number
  current: number
  ionizationOn: boolean
  exteriorTemp?: number
  exteriorHumidity?: number
}

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export function AIChat({
  temperature,
  humidity,
  voltage,
  current,
  ionizationOn,
  exteriorTemp = 0,
  exteriorHumidity = 0,
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola, soy el asistente de IonDroplet. Puedes preguntarme sobre los sensores, el estado del sistema o las lecturas actuales.",
      timestamp: new Date().toLocaleTimeString("es-ES")
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("es-ES")
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
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
          max_tokens: 300,
          system: `Eres el asistente inteligente del sistema IonDroplet, un sistema rural inteligente de monitoreo y control de riego agrícola. 
          
Datos actuales del sistema:
- Temperatura interior: ${temperature.toFixed(1)}°C
- Humedad interior: ${humidity.toFixed(0)}%
- Temperatura exterior: ${exteriorTemp}°C
- Humedad exterior: ${exteriorHumidity}%
- Voltaje: ${voltage.toFixed(1)}V
- Corriente: ${current.toFixed(2)}A

El sistema regula automáticamente el riego (y conjuntamente la ionización) basándose en los parámetros óptimos del cultivo según la base de datos de IonDroplet.
Si preguntan "cómo está el cultivo", evalúa los datos e indica si el sistema regará para llegar a la humedad requerida.

Responde en español, de forma breve y clara. Máximo 3 oraciones. Si te preguntan si algo está bien, analiza los datos y da una respuesta directa.`,
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: input }
          ]
        })
      })

      const data = await response.json()
      const text = data.content[0].text.trim()

      setMessages(prev => [...prev, {
        role: "assistant",
        content: text,
        timestamp: new Date().toLocaleTimeString("es-ES")
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Error al conectar con la IA. Intenta de nuevo.",
        timestamp: new Date().toLocaleTimeString("es-ES")
      }])
    }
    setLoading(false)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          Asistente IA — IonDroplet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mensajes */}
        <div className="h-64 overflow-y-auto rounded-lg border border-border bg-muted/10 p-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
                msg.role === "user" ? "bg-primary" : "bg-muted"
              )}>
                {msg.role === "user"
                  ? <User className="h-3 w-3 text-primary-foreground" />
                  : <Bot className="h-3 w-3 text-muted-foreground" />
                }
              </div>
              <div className={cn(
                "max-w-[80%] rounded-lg px-3 py-2",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}>
                <p className="text-xs leading-relaxed">{msg.content}</p>
                <p className={cn(
                  "mt-1 text-[9px]",
                  msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                )}>{mounted ? msg.timestamp : "--:--:--"}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <Bot className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Pregunta algo sobre el sistema..."
            className="flex-1 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="sm"
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}