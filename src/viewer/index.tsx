import React from 'react'
import { createRoot } from 'react-dom/client'
import { ClaudeCodeTranscript } from '../react/ClaudeCodeTranscript'
import '../react/styles.css'

interface TranscriptData {
  events: Array<{
    uuid: string
    event_type: string
    payload: Record<string, unknown>
    created_at: string
  }>
  projectPath?: string
  colorScheme?: 'light' | 'dark'
}

function App({ data }: { data: TranscriptData }) {
  return (
    <ClaudeCodeTranscript
      events={data.events}
      projectPath={data.projectPath}
      colorScheme={data.colorScheme ?? 'light'}
    />
  )
}

async function main() {
  const rootEl = document.getElementById('root')
  if (!rootEl) return

  const root = createRoot(rootEl)

  const pathParts = location.pathname.split('/session/')
  const sessionId = pathParts[1]
  if (!sessionId) {
    root.render(<div>No session ID found in URL.</div>)
    return
  }

  root.render(<div style={{ padding: '2rem', color: '#666' }}>Loading...</div>)

  const colorScheme = (window as any).__COLOR_SCHEME__ as 'light' | 'dark' | undefined

  try {
    const res = await fetch(`/api/sessions/${sessionId}/events`)
    if (!res.ok) throw new Error(`Failed to load session: ${res.statusText}`)
    const data: TranscriptData = await res.json()
    if (colorScheme) data.colorScheme = colorScheme
    root.render(<App data={data} />)
  } catch (err) {
    root.render(
      <div style={{ padding: '2rem', color: '#c00' }}>
        Error: {err instanceof Error ? err.message : 'Unknown error'}
      </div>
    )
  }
}

main()
