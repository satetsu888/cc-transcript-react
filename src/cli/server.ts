import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSessionLog } from '../core/session-log.js'
import { discoverSessions, readSessionFile, type SessionEntry } from './session-discovery.js'
import { sessionListPage, sessionPage } from './templates.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface ServerOptions {
  port: number
  colorScheme: 'light' | 'dark'
  /** If set, only this session is served (no list page). */
  sessionId?: string
}

export function startServer(options: ServerOptions): Promise<http.Server> {
  const { port, colorScheme, sessionId: fixedSessionId } = options

  // Cache sessions list (refreshed on each list request)
  let sessions: SessionEntry[] = []
  const sessionMap = new Map<string, SessionEntry>()

  function refreshSessions() {
    sessions = discoverSessions()
    sessionMap.clear()
    for (const s of sessions) {
      sessionMap.set(s.sessionId, s)
    }
  }

  // Resolve dist assets path
  const distDir = path.resolve(__dirname)

  function serveAsset(res: http.ServerResponse, filename: string, contentType: string) {
    const filePath = path.join(distDir, filename)
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  }

  function jsonResponse(res: http.ServerResponse, data: unknown) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  function htmlResponse(res: http.ServerResponse, html: string) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  }

  function notFound(res: http.ServerResponse) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`)
    const pathname = url.pathname

    // Static assets
    if (pathname === '/assets/viewer.js') {
      return serveAsset(res, 'viewer.global.js', 'application/javascript')
    }
    if (pathname === '/assets/styles.css') {
      return serveAsset(res, 'index.css', 'text/css')
    }

    // API: session list
    if (pathname === '/api/sessions') {
      refreshSessions()
      const list = (fixedSessionId ? sessions.filter(s => s.sessionId === fixedSessionId) : sessions)
        .map(s => ({
          sessionId: s.sessionId,
          firstPrompt: s.firstPrompt,
          lastPrompt: s.lastPrompt,
          messageCount: s.messageCount,
          modified: s.modified,
          projectPath: s.projectPath,
        }))
      return jsonResponse(res, list)
    }

    // API: session events
    const eventsMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/events$/)
    if (eventsMatch) {
      const id = eventsMatch[1]
      refreshSessions()
      const session = sessionMap.get(id)
      if (!session) return notFound(res)

      try {
        const content = readSessionFile(session.fullPath)
        const events = parseSessionLog(content)
        return jsonResponse(res, {
          events,
          projectPath: session.projectPath,
          colorScheme,
        })
      } catch {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        return res.end('Failed to read session')
      }
    }

    // Page: session detail
    const sessionMatch = pathname.match(/^\/session\/([^/]+)$/)
    if (sessionMatch) {
      return htmlResponse(res, sessionPage(sessionMatch[1], colorScheme))
    }

    // Page: session list (root)
    if (pathname === '/') {
      if (fixedSessionId) {
        // Redirect to the fixed session
        res.writeHead(302, { Location: `/session/${fixedSessionId}` })
        return res.end()
      }
      refreshSessions()
      return htmlResponse(res, sessionListPage(sessions, colorScheme))
    }

    return notFound(res)
  })

  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(port, () => {
      resolve(server)
    })
  })
}
