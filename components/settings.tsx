'use client'

import { useState } from 'react'
import { useMqtt } from './mqtt-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Settings() {
  const { config, updateConfig, reconnect, isConnected } = useMqtt()
  const [formData, setFormData] = useState(config)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSave = () => {
    updateConfig(formData)
    setTestResult({ success: true, message: 'Configuration saved successfully!' })
    setTimeout(() => setTestResult(null), 3000)
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      if (isConnected) {
        setTestResult({ success: true, message: 'Connection test successful!' })
      } else {
        setTestResult({ success: false, message: 'Connection failed. Please check your settings.' })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed.' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleReconnect = () => {
    reconnect()
    setTestResult({ success: true, message: 'Reconnecting...' })
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
    }
    setFormData(defaultConfig)
    updateConfig(defaultConfig)
    setTestResult({ success: true, message: 'Reset to default settings!' })
    setTimeout(() => setTestResult(null), 3000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">MQTT Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure your MQTT broker connection and topic subscriptions
          </p>
        </div>

        <div className="space-y-4">
          {/* Broker Settings */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Broker Settings</h3>
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
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 8084 })}
                  placeholder="8084"
                />
              </div>
            </div>
          </div>

          {/* Topic Settings */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">MQTT Topics</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic_online">Device Status Topic</Label>
                <Input
                  id="topic_online"
                  value={formData.topic_online}
                  onChange={(e) => setFormData({ ...formData, topic_online: e.target.value })}
                  placeholder="pico/online"
                />
                <p className="text-xs text-muted-foreground">Publishes 1 (online) or 0 (offline)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic_spectrum">Spectrum Data Topic</Label>
                <Input
                  id="topic_spectrum"
                  value={formData.topic_spectrum}
                  onChange={(e) => setFormData({ ...formData, topic_spectrum: e.target.value })}
                  placeholder="pico/c12880/exp"
                />
                <p className="text-xs text-muted-foreground">Publishes array of 288 intensity values</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic_carbon">Carbon Estimation Topic</Label>
                <Input
                  id="topic_carbon"
                  value={formData.topic_carbon}
                  onChange={(e) => setFormData({ ...formData, topic_carbon: e.target.value })}
                  placeholder="pico/carbon"
                />
                <p className="text-xs text-muted-foreground">Publishes carbon value as float (percentage or g/kg)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic_log">System Log Topic</Label>
                <Input
                  id="topic_log"
                  value={formData.topic_log}
                  onChange={(e) => setFormData({ ...formData, topic_log: e.target.value })}
                  placeholder="pico/log"
                />
                <p className="text-xs text-muted-foreground">Publishes text messages</p>
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
              Save Configuration
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
              {isTesting ? 'Testing...' : 'Test Connection'}
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
              Reconnect
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset to Default
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
                <span className="text-sm font-medium">{testResult.message}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Connection Status */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Current Connection Status</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm text-muted-foreground">MQTT Broker</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-success animate-pulse-slow' : 'bg-destructive'
                }`}
              />
              <span className="text-sm font-medium text-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm text-muted-foreground">WebSocket Protocol</span>
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
            <h4 className="text-sm font-semibold text-foreground">Configuration Tips</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• The application uses WebSocket Secure (WSS) for MQTT connections</li>
              <li>• Default broker is public and requires no authentication</li>
              <li>• All settings are saved locally in your browser</li>
              <li>• Click "Reconnect" after changing settings to apply changes</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
