"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind, Droplets, Thermometer, ArrowUpDown, MapPin } from "lucide-react"

const LAT = 28.6353
const LON = -106.0889
const CITY = "Chihuahua"
const STATE = "Chihuahua"
const COUNTRY = "México"

interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
}

interface WeatherCardProps {
  interiorTemp: number
  interiorHumidity: number
}

function getWeatherIcon(code: number) {
  if (code === 0) return Sun
  if (code >= 1 && code <= 3) return Cloud
  if (code >= 45 && code <= 48) return Cloud
  if (code >= 51 && code <= 67) return CloudRain
  if (code >= 71 && code <= 77) return CloudSnow
  if (code >= 80 && code <= 82) return CloudRain
  if (code >= 95 && code <= 99) return CloudLightning
  return Sun
}

function getWeatherLabel(code: number): string {
  if (code === 0) return "Despejado"
  if (code >= 1 && code <= 3) return "Parcialmente nublado"
  if (code >= 45 && code <= 48) return "Niebla"
  if (code >= 51 && code <= 55) return "Llovizna"
  if (code >= 56 && code <= 57) return "Llovizna helada"
  if (code >= 61 && code <= 65) return "Lluvia"
  if (code >= 66 && code <= 67) return "Lluvia helada"
  if (code >= 71 && code <= 77) return "Nieve"
  if (code >= 80 && code <= 82) return "Chubascos"
  if (code >= 95 && code <= 99) return "Tormenta"
  return "Desconocido"
}

export function WeatherCard({ interiorTemp, interiorHumidity }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
      )
      if (!response.ok) throw new Error("Error al obtener datos")
      const data = await response.json()
      setWeather({
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
      })
      setError(null)
    } catch {
      setError("Sin conexion")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchWeather])

  const WeatherIcon = weather ? getWeatherIcon(weather.weatherCode) : Sun
  const humidityDiff = weather ? interiorHumidity - weather.humidity : 0
  const needsIonization = humidityDiff > 10

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${LON - 0.05}%2C${LAT - 0.05}%2C${LON + 0.05}%2C${LAT + 0.05}&layer=mapnik&marker=${LAT}%2C${LON}`

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex h-[180px] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            Clima Exterior
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-destructive">{error || "Sin datos"}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <WeatherIcon className="h-4 w-4 text-primary" />
          Clima Exterior
          <span className="ml-auto text-[10px] font-normal text-muted-foreground">
            {getWeatherLabel(weather.weatherCode)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Ubicacion */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">{CITY}, {STATE}</span>
          <span className="text-xs text-muted-foreground">— {COUNTRY}</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">{LAT}°N {Math.abs(LON)}°O</span>
        </div>

        {/* Mapa */}
        <div className="overflow-hidden rounded-lg border border-border" style={{ height: '140px' }}>
          <iframe
            src={mapUrl}
            width="100%"
            height="140"
            style={{ border: 'none', display: 'block' }}
            title="Ubicación del terreno"
          />
        </div>

        {/* Datos exteriores */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <Thermometer className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="mt-1 font-mono text-lg font-semibold">{weather.temperature.toFixed(1)}°</p>
            <p className="text-[10px] text-muted-foreground">Temp</p>
          </div>
          <div className="text-center">
            <Droplets className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="mt-1 font-mono text-lg font-semibold">{weather.humidity}%</p>
            <p className="text-[10px] text-muted-foreground">Humedad</p>
          </div>
          <div className="text-center">
            <Wind className="mx-auto h-4 w-4 text-muted-foreground" />
            <p className="mt-1 font-mono text-lg font-semibold">{weather.windSpeed.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">km/h</p>
          </div>
        </div>

        {/* Comparacion Interior vs Exterior */}
        <div className={cn(
          "rounded-lg border p-3",
          needsIonization ? "border-warning/50 bg-warning/5" : "border-border bg-muted/30"
        )}>
          <div className="mb-2 flex items-center gap-1.5">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">Interior vs Exterior</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Temperatura</p>
              <p className="font-mono font-medium">
                {interiorTemp.toFixed(1)}° vs {weather.temperature.toFixed(1)}°
                <span className={cn(
                  "ml-1",
                  interiorTemp > weather.temperature ? "text-destructive" : "text-success"
                )}>
                  ({interiorTemp > weather.temperature ? "+" : ""}{(interiorTemp - weather.temperature).toFixed(1)}°)
                </span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Humedad</p>
              <p className="font-mono font-medium">
                {interiorHumidity.toFixed(0)}% vs {weather.humidity}%
                <span className={cn(
                  "ml-1",
                  needsIonization ? "text-warning" : interiorHumidity > weather.humidity ? "text-muted-foreground" : "text-success"
                )}>
                  ({interiorHumidity > weather.humidity ? "+" : ""}{humidityDiff.toFixed(0)}%)
                </span>
              </p>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}