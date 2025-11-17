'use client'

import { useState } from 'react'
import { Dashboard } from '@/components/dashboard'
import { History } from '@/components/history'
import { Settings } from '@/components/settings'
import { MqttProvider } from '@/components/mqtt-provider'

export default function Page() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard')

  return (
    <MqttProvider>
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg
                  className="h-5 w-5 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Tellus Monitoring</h1>
                <p className="text-xs text-muted-foreground">Spectroscopy System</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Settings
              </button>
            </div>
          </div>
        </nav>
        
        <main className="container mx-auto p-4">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'history' && <History />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </MqttProvider>
  )
}
