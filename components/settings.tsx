'use client'

import { useState } from 'react'
import { useMqtt } from './mqtt-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export function Settings() {
  const { config, updateConfig, reconnect, isConnected } = useMqtt()
  const [formData, setFormData] = useState(config)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [rememberCredentials, setRememberCredentials] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('remember_credentials') === 'true'
    }
    return false
  })

  const handleSave = () => {
    const configToSave = { ...formData }
    
    if (typeof window !== 'undefined') {
      if (rememberCredentials) {
        localStorage.setItem('mqtt_config', JSON.stringify(configToSave))
        localStorage.setItem('remember_credentials', 'true')
      } else {
        const configWithoutPassword = { ...configToSave, password: '' }
        localStorage.setItem('mqtt_config', JSON.stringify(configWithoutPassword))
        localStorage.setItem('remember_credentials', 'false')
      }
    }
    
    updateConfig(configToSave)
    setTestResult({ success: true, message: 'Configuração salva com sucesso!' })
    setTimeout(() => setTestResult(null), 3000)
  }

  const handleTest = async () => {
    if (formData.username && !formData.password) {
      setTestResult({ 
        success: false, 
        message: 'Por favor, forneça a senha para autenticação.' 
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      if (isConnected) {
        setTestResult({ success: true, message: 'Conectado com sucesso!' })
      } else {
        setTestResult({ success: false, message: 'Falha na conexão. Verifique suas configurações.' })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Falha no teste de conexão.' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleReconnect = () => {
    reconnect()
    setTestResult({ success: true, message: 'Reconectando...' })
    setTimeout(() => setTestResult(null), 3000)
  }

  const handleReset = () => {
    const defaultConfig = {
      host: 'broker.emqx.io',
      port: 8084,
      topic_online: 'pico/online',
      topic_spectrum: 'pico/c12880/exp',
      topic_log: 'pico/log',
      topic_carbon: 'pico/carbon',
      username: '',
      password: '',
    }
    setFormData(defaultConfig)
    updateConfig(defaultConfig)
    setRememberCredentials(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('remember_credentials', 'false')
    }
    setTestResult({ success: true, message: 'Configurações restauradas para o padrão!' })
    setTimeout(() => setTestResult(null), 3000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Configuração MQTT</h2>
          <p className="text-sm text-muted-foreground">
            Configure a conexão com o broker MQTT e as inscrições de tópicos
          </p>
        </div>

        <div className="space-y-4">
          {/* Broker Settings */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Configurações do Broker</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="broker.emqx.io"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 8084 })}
                  placeholder="8084"
                />
              </div>
            </div>
            
            {/* Authentication Fields */}
            <div className="mt-4 space-y-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <h4 className="text-sm font-semibold text-foreground">Autenticação (Opcional)</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário MQTT</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Deixe em branco se não houver autenticação"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha MQTT</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Deixe em branco se não houver autenticação"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberCredentials}
                  onCheckedChange={(checked) => setRememberCredentials(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Lembrar credenciais (salva a senha no navegador)
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Se desmarcado, a senha será mantida apenas na memória durante esta sessão.
              </p>
            </div>
          </div>

          {/* Topic Settings */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Tópicos MQTT</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic_online">Tópico de Status do Dispositivo</Label>
                <Input
                  id="topic_online"
                  value={formData.topic_online}
                  onChange={(e) => setFormData({ ...formData, topic_online: e.target.value })}
                  placeholder="pico/online"
                />
                <p className="text-xs text-muted-foreground">Publica 1 (online) ou 0 (offline)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic_spectrum">Tópico de Dados do Espectro</Label>
                <Input
                  id="topic_spectrum"
                  value={formData.topic_spectrum}
                  onChange={(e) => setFormData({ ...formData, topic_spectrum: e.target.value })}
                  placeholder="pico/c12880/exp"
                />
                <p className="text-xs text-muted-foreground">Publica array de 288 valores de intensidade</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic_carbon">Tópico de Estimativa de Carbono</Label>
                <Input
                  id="topic_carbon"
                  value={formData.topic_carbon}
                  onChange={(e) => setFormData({ ...formData, topic_carbon: e.target.value })}
                  placeholder="pico/carbon"
                />
                <p className="text-xs text-muted-foreground">Publica valor de carbono como float (percentual ou g/kg)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic_log">Tópico de Log do Sistema</Label>
                <Input
                  id="topic_log"
                  value={formData.topic_log}
                  onChange={(e) => setFormData({ ...formData, topic_log: e.target.value })}
                  placeholder="pico/log"
                />
                <p className="text-xs text-muted-foreground">Publica mensagens de texto</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Salvar Configuração
            </Button>
            <Button onClick={handleTest} disabled={isTesting} variant="outline">
              <svg
                className={`mr-2 h-4 w-4 ${isTesting ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>
            <Button onClick={handleReconnect} variant="outline">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Reconectar
            </Button>
            <Button onClick={handleReset} variant="outline">
              Restaurar Padrão
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`rounded-lg border p-4 ${
                testResult.success
                  ? 'border-success/50 bg-success/10 text-success-foreground'
                  : 'border-destructive/50 bg-destructive/10 text-destructive-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                <span className="text-black-500 text-sm font-medium">{testResult.message}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Connection Status */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Status da Conexão Atual</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm text-muted-foreground">Broker MQTT</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-success animate-pulse-slow' : 'bg-destructive'
                }`}
              />
              <span className="text-sm font-medium text-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm text-muted-foreground">Protocolo WebSocket</span>
            <span className="text-sm font-medium text-foreground">WSS</span>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="border-accent/50 bg-accent/5 p-6">
        <div className="flex gap-3">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Dicas de Configuração</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• A aplicação usa WebSocket Secure (WSS) para conexões MQTT</li>
              <li>• O broker padrão é público e não requer autenticação</li>
              <li>• Todas as configurações são salvas localmente no seu navegador</li>
              <li>• Clique em "Reconectar" após alterar as configurações para aplicar as mudanças</li>
              <li>• Use autenticação apenas se o seu broker MQTT exigir credenciais</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
