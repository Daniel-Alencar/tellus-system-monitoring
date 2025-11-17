"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import mqtt from "mqtt"

export interface MQTTConfig {
  brokerUrl: string
  port: string
  username: string
  password: string
}

interface SpectrumData {
  timestamp: string
  values: number[]
  carbon?: number
}

interface SensorData {
  current: SpectrumData | null
  lastUpdate: string | null
}

const MAX_HISTORY_POINTS = 50

export function useMQTTConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected")
  const [error, setError] = useState<string | null>(null)
  const [deviceOnline, setDeviceOnline] = useState(false)
  const [spectrumData, setSpectrumData] = useState<SensorData>({
    current: null,
    lastUpdate: null,
  })
  const [currentCarbon, setCurrentCarbon] = useState<number | null>(null)
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string }>>([])

  const clientRef = useRef<mqtt.MqttClient | null>(null)
  const lastDataTimeRef = useRef<number>(0)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const markDeviceActive = useCallback(() => {
    lastDataTimeRef.current = Date.now()
    setDeviceOnline(true)

    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }

    // Set timeout (30 seconds of inactivity)
    inactivityTimeoutRef.current = setTimeout(() => {
      console.log("[v0] Device inactive for 30 seconds, marking as offline")
      setDeviceOnline(false)
    }, 30000)
  }, [])

  const connect = useCallback(
    (config: MQTTConfig, topics: { online: string; spectrum: string; log: string; carbon: string }) => {
      try {
        setError(null)
        setConnectionStatus("Connecting...")

        const wsUrl = `ws://${config.brokerUrl}:${config.port}/mqtt`

        console.log("[v0] Connecting to:", wsUrl)
        console.log("[v0] Username:", config.username)

        const client = mqtt.connect(wsUrl, {
          username: config.username,
          password: config.password,
          clientId: `tellus_monitor_${Math.random().toString(16).slice(2, 10)}`,
          clean: true,
          reconnectPeriod: 5000,
        })

        client.on("connect", () => {
          console.log("[v0] Connected to MQTT broker")
          setIsConnected(true)
          setConnectionStatus("Connected")
          setError(null)

          const topicsToSubscribe = [
            topics.online,
            topics.spectrum,
            topics.log,
            topics.carbon,
          ]

          topicsToSubscribe.forEach((topic) => {
            client.subscribe(topic, (err) => {
              if (err) {
                console.error(`[v0] Failed to subscribe to ${topic}:`, err)
              } else {
                console.log(`[v0] Subscribed to ${topic}`)
              }
            })
          })
        })

        client.on("message", (topic, message) => {
          const payload = message.toString()
          console.log(`[v0] Received message - Topic: "${topic}" | Payload: "${payload.substring(0, 100)}..."`)

          if (topic === topics.online) {
            const isOnline = payload === "1" || payload.toLowerCase() === "true" || payload.toLowerCase() === "online"
            console.log("[v0] Device online status:", isOnline)
            if (isOnline) {
              markDeviceActive()
            } else {
              setDeviceOnline(false)
            }
          } 
          else if (topic === topics.spectrum) {
            try {
              const values = JSON.parse(payload)
              if (Array.isArray(values) && values.length === 288) {
                markDeviceActive()
                const spectrum: SpectrumData = {
                  timestamp: new Date().toISOString(),
                  values,
                  carbon: currentCarbon ?? undefined,
                }
                setSpectrumData({
                  current: spectrum,
                  lastUpdate: new Date().toLocaleTimeString(),
                })
                console.log("[v0] Spectrum updated with 288 values")
              } else {
                console.warn("[v0] Invalid spectrum data. Expected: array with 288 values, received:", values?.length)
              }
            } catch (error) {
              console.error("[v0] Error parsing spectrum data:", error)
            }
          }
          else if (topic === topics.log) {
            const logEntry = {
              timestamp: new Date().toISOString(),
              message: payload,
            }
            setLogs((prev) => [...prev.slice(-199), logEntry])
          }
          else if (topic === topics.carbon) {
            try {
              const carbonValue = parseFloat(payload)
              if (!isNaN(carbonValue)) {
                markDeviceActive()
                setCurrentCarbon(carbonValue)
                console.log("[v0] Carbon value updated:", carbonValue)
              }
            } catch (error) {
              console.error("[v0] Error parsing carbon value:", error)
            }
          }
        })

        client.on("error", (err) => {
          console.error("[v0] MQTT error:", err)
          setError(`Connection error: ${err.message}`)
          setConnectionStatus("Error")
        })

        client.on("close", () => {
          console.log("[v0] MQTT connection closed")
          setIsConnected(false)
          setConnectionStatus("Disconnected")
        })

        client.on("offline", () => {
          console.log("[v0] MQTT client offline")
          setConnectionStatus("Offline")
        })

        client.on("reconnect", () => {
          console.log("[v0] Reconnecting to MQTT broker...")
          setConnectionStatus("Reconnecting...")
        })

        clientRef.current = client
      } catch (err) {
        console.error("[v0] Failed to connect:", err)
        setError(`Failed to connect: ${err instanceof Error ? err.message : "Unknown error"}`)
        setConnectionStatus("Error")
      }
    },
    [markDeviceActive, currentCarbon]
  )

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end()
      clientRef.current = null
      setIsConnected(false)
      setConnectionStatus("Disconnected")
      setDeviceOnline(false)
      setSpectrumData({
        current: null,
        lastUpdate: null,
      })
      setCurrentCarbon(null)
      setLogs([])

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.end()
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    connectionStatus,
    spectrumData,
    currentCarbon,
    deviceOnline,
    logs,
    connect,
    disconnect,
    error,
  }
}
