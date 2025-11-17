'use client'

import { useEffect, useRef } from 'react'
import { useMqtt } from './mqtt-provider'
import { Card } from '@/components/ui/card'
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

export function Dashboard() {
  const { isOnline, currentSpectrum, logs, isConnected } = useMqtt()
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

  return (
    <div className="space-y-4">
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
