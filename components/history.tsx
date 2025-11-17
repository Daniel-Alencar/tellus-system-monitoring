'use client'

import { useState } from 'react'
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

export function History() {
  const { savedSpectrums, currentSpectrum, saveSpectrum } = useMqtt()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleSaveCurrent = () => {
    if (currentSpectrum) {
      saveSpectrum(currentSpectrum)
    }
  }

  const handleExportCSV = () => {
    if (savedSpectrums.length === 0) {
      return
    }

    let csv = 'Timestamp,Carbon,' + Array.from({ length: 288 }, (_, i) => `Pixel_${i}`).join(',') + '\n'
    
    savedSpectrums.forEach((spectrum) => {
      const carbonValue = spectrum.carbon !== undefined ? spectrum.carbon.toFixed(2) : ''
      csv += `${spectrum.timestamp},${carbonValue},${spectrum.values.join(',')}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tellus_spectrums_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const selectedSpectrum = selectedIndex !== null ? savedSpectrums[selectedIndex] : null

  const chartData = selectedSpectrum
    ? {
        labels: Array.from({ length: 288 }, (_, i) => i.toString()),
        datasets: [
          {
            label: 'Intensity',
            data: selectedSpectrum.values,
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
      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Spectrum History</h2>
            <p className="text-sm text-muted-foreground">
              {savedSpectrums.length} of 30 spectrums saved locally
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveCurrent} disabled={!currentSpectrum} variant="outline">
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
              Save Current
            </Button>
            <Button onClick={handleExportCSV} disabled={savedSpectrums.length === 0}>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Saved Spectrums List */}
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Saved Readings</h3>
          <div className="space-y-2">
            {savedSpectrums.length === 0 ? (
              <div className="rounded-lg bg-muted/30 p-8 text-center">
                <svg
                  className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-sm text-muted-foreground">No saved spectrums yet</p>
              </div>
            ) : (
              savedSpectrums.map((spectrum, index) => (
                <button
                  key={spectrum.timestamp}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedIndex === index
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Reading #{savedSpectrums.length - index}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(spectrum.timestamp).toLocaleString()}
                      </p>
                      {spectrum.carbon !== undefined && (
                        <p className="mt-1 text-xs font-medium text-primary">
                          Carbon: {spectrum.carbon.toFixed(2)}%
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">288 px</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Selected Spectrum Chart */}
        <Card className="p-4 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Selected Spectrum</h3>
            {selectedSpectrum && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedSpectrum.timestamp).toLocaleString()}
                </p>
                {selectedSpectrum.carbon !== undefined && (
                  <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                    <svg
                      className="h-4 w-4 text-primary"
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
                    <span className="text-sm font-semibold text-primary">
                      Carbon: {selectedSpectrum.carbon.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="h-[500px]">
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
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">No spectrum selected</p>
                  <p className="text-xs text-muted-foreground">Select a reading from the list to view</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
