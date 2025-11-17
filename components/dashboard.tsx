'use client'

import { useEffect, useRef } from 'react'
import { useMqtt } from './mqtt-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

function getCarbonLevel(carbon: number): { label: string; color: string; bgColor: string } {
  if (carbon < 1.0) {
    return { label: 'Amostra pobre em carbono', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' }
  } else if (carbon < 2.0) {
    return { label: 'Regular', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' }
  } else if (carbon < 3.5) {
    return { label: 'Alta', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10 border-green-500/30' }
  } else {
    return { label: 'Muito Alta', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30' }
  }
}

export function Dashboard() {
  const { isOnline, currentSpectrum, currentCarbon, logs, isConnected, authError, clearAuthError } = useMqtt()
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const chartData = currentSpectrum
    ? {
        labels: Array.from({ length: 288 }, (_, i) => i.toString()),
        datasets: [
          {
            label: 'Intensity',
            data: currentSpectrum.values,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 2,
            fill: true,
            pointRadius: 0,
            tension: 0.1,
          },
        ],
      }
    : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Pixel',
          color: 'rgb(148, 163, 184)',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          maxTicksLimit: 10,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Intensity',
          color: 'rgb(148, 163, 184)',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
        },
      },
    },
  }

  const carbonInfo = currentCarbon !== null ? getCarbonLevel(currentCarbon) : null

  return (
    <div className="space-y-4">
      {authError && (
        <Card className="border-2 border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <svg
                className="mt-0.5 h-6 w-6 flex-shrink-0 text-destructive"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-destructive-foreground">Erro de Autenticação MQTT</h3>
                <p className="mt-1 text-sm text-destructive-foreground/90">{authError}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Por favor, verifique suas credenciais na aba <strong>Configurações</strong> e reconecte.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAuthError}
              className="flex-shrink-0 text-destructive-foreground hover:bg-destructive/20"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </div>
        </Card>
      )}

      {/* Status Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">MQTT Connection:</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isConnected ? 'bg-success animate-pulse-slow' : 'bg-destructive'
                  }`}
                />
                <span className="text-sm font-medium text-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Device Status:</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isOnline ? 'bg-success animate-pulse-slow' : 'bg-destructive'
                  }`}
                />
                <span className="text-sm font-medium text-foreground">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          {currentSpectrum && (
            <div className="text-sm text-muted-foreground">
              Last Reading: {new Date(currentSpectrum.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      </Card>

      {currentCarbon !== null && carbonInfo && (
        <Card className={`border-2 p-6 ${carbonInfo.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/50">
                <svg
                  className={`h-8 w-8 ${carbonInfo.color}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carbono Estimado</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${carbonInfo.color}`}>
                    {currentCarbon.toFixed(2)}
                  </span>
                  <span className="text-lg font-medium text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${carbonInfo.bgColor} border`}>
                <div className={`h-2 w-2 rounded-full ${carbonInfo.color.replace('text-', 'bg-')}`} />
                <span className={`text-sm font-semibold ${carbonInfo.color}`}>
                  {carbonInfo.label}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Atualizado em tempo real
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Spectrum Chart */}
        <Card className="p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Spectrum Analysis</h2>
              <p className="text-sm text-muted-foreground">Real-time spectroscopy data (288 pixels)</p>
            </div>
          </div>
          <div className="h-[400px]">
            {chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <svg
                      className="h-8 w-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">Waiting for spectrum data</p>
                  <p className="text-xs text-muted-foreground">
                    {isConnected ? 'Connected to MQTT broker' : 'Connecting to MQTT broker...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* System Logs */}
        <Card className="p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">System Logs</h2>
            <p className="text-sm text-muted-foreground">Live event stream</p>
          </div>
          <div className="h-[400px] overflow-y-auto rounded-lg bg-muted/30 p-3 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                No logs received yet
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
