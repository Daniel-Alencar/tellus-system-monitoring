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
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('disconnected')
  const [lastConnectedTime, setLastConnectedTime] = useState<Date | null>(null)
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
      
      console.log('[v0] Iniciando conexão MQTT WebSocket')
      console.log('[v0] URL:', url)
      console.log('[v0] Usuário:', config.username)
      console.log('[v0] Senha:', config.password ? '****' : '(não fornecida)')
      
      setConnectionState('connecting')
      
      const connectOptions: any = {
        clientId: `tellus_monitor_${Math.random().toString(16).substr(2, 8)}`,
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: shouldAutoReconnect ? 2000 : 0,
        connectTimeout: 10000,
      }
      
      if (config.username) {
        connectOptions.username = config.username
      }
      if (config.password) {
        connectOptions.password = config.password
      }

      console.log('[v0] Opções de conexão:', {
        ...connectOptions,
        password: connectOptions.password ? '****' : undefined
      })

      const mqttClient = mqtt.connect(url, connectOptions)

      mqttClient.on('connect', () => {
        console.log('[v0] ✓ Conectado ao broker MQTT com sucesso!')
        setIsConnected(true)
        setConnectionState('connected')
        setAuthError(null)
        setShouldAutoReconnect(true)
        setLastConnectedTime(new Date())
        
        const topics = [config.topic_online, config.topic_spectrum, config.topic_log, config.topic_carbon]
        console.log('[v0] Inscrevendo nos tópicos:', topics)
        
        mqttClient.subscribe(topics, (err) => {
          if (err) {
            console.error('[v0] ✗ Erro ao se inscrever nos tópicos:', err)
          } else {
            console.log('[v0] ✓ Inscrição nos tópicos bem-sucedida')
          }
        })
      })

      mqttClient.on('reconnect', () => {
        console.log('[v0] Tentando reconectar ao broker MQTT...')
        setConnectionState('reconnecting')
      })

      mqttClient.on('message', (topic, payload) => {
        const message = payload.toString()
        console.log(`[v0] Mensagem recebida no tópico "${topic}":`, message.substring(0, 100))
        
        if (topic === config.topic_online) {
          const online = message === '1'
          setIsOnline(online)
          console.log('[v0] Status do dispositivo:', online ? 'Online' : 'Offline')
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
              console.log('[v0] ✓ Espectro atualizado com 288 valores')
            } else {
              console.warn('[v0] Dados de espectro inválidos. Esperado: array com 288 valores, recebido:', values?.length)
            }
          } catch (error) {
            console.error('[v0] ✗ Erro ao analisar dados do espectro:', error)
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
              console.log('[v0] ✓ Valor de carbono atualizado:', carbonValue)
            }
          } catch (error) {
            console.error('[v0] ✗ Erro ao analisar valor de carbono:', error)
          }
        }
      })

      mqttClient.on('error', (error) => {
        console.error('[v0] ✗ Erro MQTT:', error)
        console.error('[v0] Tipo de erro:', error.name)
        console.error('[v0] Mensagem:', error.message)
        
        setIsConnected(false)
        setConnectionState('error')
        
        const errorMessage = error.message || error.toString()
        
        if (
          errorMessage.includes('Not authorized') ||
          errorMessage.includes('authentication') ||
          errorMessage.includes('Connection refused') ||
          errorMessage.includes('Bad username or password') ||
          errorMessage.includes('not authorized') ||
          error.name === 'ConnectionRefusedError'
        ) {
          console.error('[v0] ✗ Erro de autenticação detectado')
          setAuthError('Falha na autenticação. Verifique suas credenciais.')
          setShouldAutoReconnect(false)
          mqttClient.end(true)
        } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
          console.error('[v0] ✗ Host não encontrado')
          setAuthError('Não foi possível resolver o host. Verifique o endereço do broker.')
        } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
          console.error('[v0] ✗ Timeout de conexão')
          setAuthError('Timeout de conexão. Verifique sua conexão de rede.')
        } else if (errorMessage.includes('TLS') || errorMessage.includes('SSL')) {
          console.error('[v0] ✗ Erro TLS/SSL')
          setAuthError('Erro de segurança TLS. Verifique as configurações do broker.')
        }
      })

      mqttClient.on('close', () => {
        console.log('[v0] Conexão MQTT fechada')
        setIsConnected(false)
        if (connectionState !== 'error') {
          setConnectionState('disconnected')
        }
      })

      mqttClient.on('offline', () => {
        console.log('[v0] Cliente MQTT offline')
        setIsConnected(false)
        setConnectionState('disconnected')
      })

      setClient(mqttClient)
    } catch (error) {
      console.error('[v0] ✗ Falha ao criar cliente MQTT:', error)
      setIsConnected(false)
      setConnectionState('error')
    }
  }, [config, currentCarbon, shouldAutoReconnect, connectionState])

  useEffect(() => {
    connectMqtt()
    return () => {
      if (client) {
        console.log('[v0] Encerrando conexão MQTT')
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
