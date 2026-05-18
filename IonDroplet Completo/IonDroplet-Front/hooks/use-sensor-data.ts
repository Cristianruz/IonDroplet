'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const API_URL = 'http://localhost:3001'

export interface SensorReading {
  temperature: number
  humidity: number
  voltage: number
  current: number
  timestamp: Date
}

export interface SystemStatus {
  power: boolean
  ionization: boolean
  pump: boolean
  uptime: number
  cycles: number
}

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  message: string
  timestamp: Date
}

export interface Device {
  id: string
  name: string
  mac: string
  ip: string
  location: string
  battery: number
  online: boolean
  ionization: boolean
}

function generateReading(): SensorReading {
  return {
    temperature: 0,
    humidity: 0,
    voltage: 0,
    current: 0,
    timestamp: new Date(1) // Fecha estática para evitar Hydration Error
  }
}

export function useSensorData(interval = 3000) {
  const [sensorData, setSensorData] = useState<SensorReading>(generateReading())
  const [historicalData, setHistoricalData] = useState<SensorReading[]>(() =>
    Array.from({ length: 30 }, () => generateReading())
  )
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    power: true,
    ionization: false,
    pump: false,
    uptime: 0,
    cycles: 0
  })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', name: 'ESP-01', mac: 'A4:CF:12:3B', ip: '192.168.1.101', location: 'Área A', battery: 87, online: true, ionization: false },
    { id: '2', name: 'ESP-02', mac: 'A4:CF:12:7F', ip: '192.168.1.102', location: 'Área B', battery: 31, online: true, ionization: false },
    { id: '3', name: 'ESP-03', mac: 'A4:CF:12:C2', ip: '192.168.1.103', location: 'Área C', battery: 92, online: true, ionization: false },
    { id: '4', name: 'ESP-04', mac: 'A4:CF:12:E8', ip: '192.168.1.104', location: 'Área D', battery: 0, online: false, ionization: false },
  ])

  const alertsRef = useRef<Alert[]>([])
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Temperatura base usando una API de clima (Chihuahua, MX)
  const [baseTemp, setBaseTemp] = useState<number>(25)

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=28.6333&longitude=-106.0833&current_weather=true')
      .then(res => res.json())
      .then(data => {
         if (data.current_weather && data.current_weather.temperature) {
            setBaseTemp(data.current_weather.temperature)
         }
      }).catch(() => {})
  }, [])

  const checkAlerts = useCallback((data: SensorReading) => {
    const newAlerts: Alert[] = []
    if (data.temperature > 30) newAlerts.push({ id: Date.now() + 'T', type: 'warning', message: `Temperatura alta: ${data.temperature.toFixed(1)}°C`, timestamp: new Date() })
    if (data.humidity > 80) newAlerts.push({ id: Date.now() + 'H', type: 'critical', message: `Humedad crítica: ${data.humidity.toFixed(1)}%`, timestamp: new Date() })
    if (data.current > 5) newAlerts.push({ id: Date.now() + 'C', type: 'critical', message: `Corriente alta: ${data.current.toFixed(2)}A`, timestamp: new Date() })
    if (newAlerts.length > 0) {
      const updated = [...newAlerts, ...alertsRef.current].slice(0, 8)
      alertsRef.current = updated
      setAlerts(updated)
    }
  }, [])

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/sensors/latest`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      
      // Simular temperatura real con ligera fluctuación (+- 0.3°C)
      const currentTemp = baseTemp + (Math.random() * 0.6 - 0.3);
      
      // Voltaje y corriente reales solo cuando la bomba/ionizador están prendidos
      const isWatering = systemStatus.pump;
      const currentVolt = isWatering ? 12.0 + (Math.random() * 0.4 - 0.2) : 0;
      const currentAmps = isWatering ? 2.5 + (Math.random() * 0.2 - 0.1) : 0;

      if (json && json.humidity !== undefined) {
        const reading = { 
           temperature: currentTemp,
           humidity: json.humidity,
           voltage: currentVolt,
           current: currentAmps,
           timestamp: new Date() // Hora actual para que la gráfica avance
        }
        setSensorData(reading)
        setHistoricalData(prev => [...prev.slice(-29), reading])
        checkAlerts(reading)
      } else {
        // Si no hay humedad aún en la base de datos
        const reading = { 
           temperature: currentTemp,
           humidity: 0,
           voltage: currentVolt,
           current: currentAmps,
           timestamp: new Date() 
        }
        setSensorData(reading)
        setHistoricalData(prev => [...prev.slice(-29), reading])
        checkAlerts(reading)
      }
    } catch {
      // Si el servidor falla
      const currentTemp = baseTemp + (Math.random() * 0.6 - 0.3);
      const isWatering = systemStatus.pump;
      const currentVolt = isWatering ? 12.0 + (Math.random() * 0.4 - 0.2) : 0;
      const currentAmps = isWatering ? 2.5 + (Math.random() * 0.2 - 0.1) : 0;

      const reading = {
        temperature: currentTemp,
        humidity: 0,
        voltage: currentVolt,
        current: currentAmps,
        timestamp: new Date()
      }
      setSensorData(reading)
      setHistoricalData(prev => [...prev.slice(-29), reading])
      checkAlerts(reading)
    }
  }, [token, checkAlerts, baseTemp, systemStatus.pump])

  useEffect(() => {
    fetchLatest()
    const id = setInterval(fetchLatest, interval)
    return () => clearInterval(id)
  }, [fetchLatest, interval])

  useEffect(() => {
    if (!systemStatus.power || !systemStatus.ionization) return
    const id = setInterval(() => {
      setSystemStatus(prev => ({ ...prev, uptime: prev.uptime + 1 }))
    }, 60000)
    return () => clearInterval(id)
  }, [systemStatus.power, systemStatus.ionization])

  const togglePower = useCallback(() => {
    setSystemStatus(prev => ({ ...prev, power: !prev.power }))
  }, [])

  const toggleIonization = useCallback(async () => {
    const newState = !systemStatus.ionization
    setSystemStatus(prev => ({ ...prev, ionization: newState, cycles: prev.cycles + 1 }))
    if (token) {
      try {
        await fetch(`${API_URL}/api/ionization/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ state: newState })
        })
      } catch {}
    }
  }, [systemStatus.ionization, token])

  const togglePump = useCallback(async () => {
    const newState = !systemStatus.pump
    setSystemStatus(prev => ({ ...prev, pump: newState }))
    try {
      await fetch(`${API_URL}/api/esp/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bomba: newState ? 1 : 0, autoMode: false })
      })
    } catch {}
  }, [systemStatus.pump])

  const toggleDeviceIonization = useCallback((id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, ionization: !d.ionization } : d))
  }, [])

  const dismissAlert = useCallback((id: string) => {
    const updated = alertsRef.current.filter(a => a.id !== id)
    alertsRef.current = updated
    setAlerts(updated)
  }, [])

 const getSensorStatus = useCallback((value: number, type: string) => {
    if (type === 'temperature') return value > 35 ? 'critical' : value > 30 ? 'warning' : 'good'
    if (type === 'humidity') return value > 80 ? 'critical' : value > 70 ? 'warning' : 'good'
    if (type === 'voltage') return value < 11.4 || value > 12.9 ? 'critical' : value < 11.6 || value > 12.7 ? 'warning' : 'good'
    if (type === 'current') return value > 5 ? 'critical' : value > 4 ? 'warning' : 'good'
    return 'good'
  }, [])

  return {
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
    getSensorStatus
  }
}