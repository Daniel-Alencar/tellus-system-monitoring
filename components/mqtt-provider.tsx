'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useMQTTConnection } from '@/hooks/use-mqtt-connection'

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
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  lastConnectedTime: Date | null
}

const MqttContext = createContext<MqttContextType | undefined>(undefined)

const DEFAULT_CONFIG: MqttConfig = {
  host: '2bb84e902cad479a8833af2a53a36fc9.s1.eu.hivemq.cloud',
  port: 8884,
  topic_online: 'pico/online',
  topic_spectrum: 'pico/c12880/exp',
  topic_log: 'pico/log',
  topic_carbon: 'pico/carbon',
  username: 'Saturno',
  password: 'Deusehfiel25',
}

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<MqttConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mqtt_config')
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG
    }
    return DEFAULT_CONFIG
  })

  const [savedSpectrums, setSavedSpectrums] = useState<SpectrumData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saved_spectrums')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [authError, setAuthError] = useState<string | null>(null)
  const [lastConnectedTime, setLastConnectedTime] = useState<Date | null>(null)

  const {
    isConnected,
    connectionStatus,
    spectrumData,
    currentCarbon,
    deviceOnline,
    logs,
    connect,
    disconnect,
    error,
  } = useMQTTConnection()

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
  }, [])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    setAuthError(null)
    setTimeout(() => {
      connect(
        {
          brokerUrl: config.host,
          port: config.port.toString(),
          username: config.username,
          password: config.password,
        },
        {
          online: config.topic_online,
          spectrum: config.topic_spectrum,
          log: config.topic_log,
          carbon: config.topic_carbon,
        }
      )
    }, 500)
  }, [config, connect, disconnect])

  const connectionState = isConnected ? 'connected' : connectionStatus === 'Connecting...' ? 'connecting' : connectionStatus === 'Reconnecting...' ? 'reconnecting' : connectionStatus === 'Error' ? 'error' : 'disconnected'

  useEffect(() => {
    if (isConnected && !lastConnectedTime) {
      setLastConnectedTime(new Date())
    }
  }, [isConnected, lastConnectedTime])

  useEffect(() => {
    if (error) {
      setAuthError(error)
    }
  }, [error])

  useEffect(() => {
    connect(
      {
        brokerUrl: config.host,
        port: config.port.toString(),
        username: config.username,
        password: config.password,
      },
      {
        online: config.topic_online,
        spectrum: config.topic_spectrum,
        log: config.topic_log,
        carbon: config.topic_carbon,
      }
    )

    return () => {
      disconnect()
    }
  }, [])

  return (
    <MqttContext.Provider
      value={{
        isOnline: deviceOnline,
        currentSpectrum: spectrumData.current,
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
        connectionState,
        lastConnectedTime,
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
