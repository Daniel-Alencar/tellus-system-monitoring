'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import mqtt, { MqttClient } from 'mqtt'

interface MqttConfig {
  host: string
  port: number
  topic_online: string
  topic_spectrum: string
  topic_log: string
  topic_carbon: string
  username: string
  password: string
}

interface SpectrumData {
  timestamp: string
  values: number[]
  carbon?: number
}

interface MqttContextType {
  isOnline: boolean
  currentSpectrum: SpectrumData | null
  logs: Array<{ timestamp: string; message: string }>
  currentCarbon: number | null
  config: MqttConfig
  updateConfig: (newConfig: MqttConfig) => void
  reconnect: () => void
  isConnected: boolean
  saveSpectrum: (spectrum: SpectrumData) => void
  savedSpectrums: SpectrumData[]
  authError: string | null
  clearAuthError: () => void
}

const MqttContext = createContext<MqttContextType | undefined>(undefined)

const DEFAULT_CONFIG: MqttConfig = {
  host: 'broker.emqx.io',
  port: 8084,
  topic_online: 'pico/online',
  topic_spectrum: 'pico/c12880/exp',
  topic_log: 'pico/log',
  topic_carbon: 'pico/carbon',
  username: '',
  password: '',
}

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<MqttClient | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [currentSpectrum, setCurrentSpectrum] = useState<SpectrumData | null>(null)
  const [currentCarbon, setCurrentCarbon] = useState<number | null>(null)
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string }>>([])
  const [config, setConfig] = useState<MqttConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mqtt_config')
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG
    }
    return DEFAULT_CONFIG
  })
  const [isConnected, setIsConnected] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [shouldAutoReconnect, setShouldAutoReconnect] = useState(true)
  const [savedSpectrums, setSavedSpectrums] = useState<SpectrumData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saved_spectrums')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const saveSpectrum = useCallback((spectrum: SpectrumData) => {
    setSavedSpectrums((prev) => {
      const updated = [spectrum, ...prev].slice(0, 30)
      if (typeof window !== 'undefined') {
        localStorage.setItem('saved_spectrums', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const updateConfig = useCallback((newConfig: MqttConfig) => {
    setConfig(newConfig)
    if (typeof window !== 'undefined') {
      localStorage.setItem('mqtt_config', JSON.stringify(newConfig))
    }
    setAuthError(null)
    setShouldAutoReconnect(true)
  }, [])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  const reconnect = useCallback(() => {
    if (client) {
      client.end(true)
    }
    setAuthError(null)
    setShouldAutoReconnect(true)
    connectMqtt()
  }, [client, config])

  const connectMqtt = useCallback(() => {
    try {
      const url = `wss://${config.host}:${config.port}/mqtt`
      
      const connectOptions: any = {
        clientId: `tellus_monitor_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        reconnectPeriod: shouldAutoReconnect ? 5000 : 0,
      }
      
      if (config.username) {
        connectOptions.username = config.username
      }
      if (config.password) {
        connectOptions.password = config.password
      }

      const mqttClient = mqtt.connect(url, connectOptions)

      mqttClient.on('connect', () => {
        setIsConnected(true)
        setAuthError(null)
        setShouldAutoReconnect(true)
        mqttClient.subscribe(
          [config.topic_online, config.topic_spectrum, config.topic_log, config.topic_carbon],
          (err) => {
            if (err) {
              console.error('Subscribe error:', err)
            }
          }
        )
      })

      mqttClient.on('message', (topic, payload) => {
        const message = payload.toString()
        
        if (topic === config.topic_online) {
          setIsOnline(message === '1')
        } else if (topic === config.topic_spectrum) {
          try {
            const values = JSON.parse(message)
            if (Array.isArray(values) && values.length === 288) {
              const spectrum: SpectrumData = {
                timestamp: new Date().toISOString(),
                values,
                carbon: currentCarbon ?? undefined,
              }
              setCurrentSpectrum(spectrum)
            }
          } catch (error) {
            console.error('Error parsing spectrum:', error)
          }
        } else if (topic === config.topic_log) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            message,
          }
          setLogs((prev) => [...prev.slice(-199), logEntry])
        } 
        else if (topic === config.topic_carbon) {
          try {
            const carbonValue = parseFloat(message)
            if (!isNaN(carbonValue)) {
              setCurrentCarbon(carbonValue)
            }
          } catch (error) {
            console.error('Error parsing carbon value:', error)
          }
        }
      })

      mqttClient.on('error', (error) => {
        console.error('MQTT error:', error)
        setIsConnected(false)
        
        const errorMessage = error.message || error.toString()
        if (
          errorMessage.includes('Not authorized') ||
          errorMessage.includes('authentication') ||
          errorMessage.includes('Connection refused') ||
          errorMessage.includes('Bad username or password')
        ) {
          setAuthError('Falha na autenticação. Verifique suas credenciais.')
          setShouldAutoReconnect(false)
          mqttClient.end(true)
        }
      })

      mqttClient.on('close', () => {
        setIsConnected(false)
      })

      setClient(mqttClient)
    } catch (error) {
      console.error('Failed to connect:', error)
      setIsConnected(false)
    }
  }, [config, currentCarbon, shouldAutoReconnect])

  useEffect(() => {
    connectMqtt()
    return () => {
      if (client) {
        client.end(true)
      }
    }
  }, [])

  return (
    <MqttContext.Provider
      value={{
        isOnline,
        currentSpectrum,
        currentCarbon,
        logs,
        config,
        updateConfig,
        reconnect,
        isConnected,
        saveSpectrum,
        savedSpectrums,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </MqttContext.Provider>
  )
}

export function useMqtt() {
  const context = useContext(MqttContext)
  if (!context) {
    throw new Error('useMqtt must be used within MqttProvider')
  }
  return context
}
