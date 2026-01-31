import type { SessionEntry } from './session-discovery.js'

export function sessionListPage(sessions: SessionEntry[], colorScheme: 'light' | 'dark' = 'light'): string {
  const isDark = colorScheme === 'dark'
  const rows = sessions.map(s => {
    const modified = new Date(s.modified).toLocaleString()
    const project = s.projectPath.split('/').slice(-2).join('/')
    const prompt = escapeHtml(truncate(s.firstPrompt, 80))
    const summary = escapeHtml(truncate(s.summary || '', 60))
    return `
      <tr onclick="location.href='/session/${s.sessionId}'" style="cursor:pointer">
        <td>${escapeHtml(project)}</td>
        <td>${prompt}</td>
        <td>${summary}</td>
        <td style="text-align:right">${s.messageCount}</td>
        <td>${modified}</td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Code Sessions</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${isDark ? '#1a1a1a' : '#f5f5f5'}; color: ${isDark ? '#e0e0e0' : '#333'}; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 1.5rem; color: ${isDark ? '#f0f0f0' : '#1a1a1a'}; }
    table { width: 100%; border-collapse: collapse; background: ${isDark ? '#2a2a2a' : '#fff'}; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,${isDark ? '0.4' : '0.1'}); }
    th { text-align: left; padding: 0.75rem 1rem; background: ${isDark ? '#333' : '#f8f8f8'}; border-bottom: 2px solid ${isDark ? '#444' : '#e5e5e5'}; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; color: ${isDark ? '#999' : '#666'}; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid ${isDark ? '#383838' : '#eee'}; font-size: 0.9rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    tr:hover td { background: ${isDark ? '#333' : '#f0f7ff'}; }
    .empty { padding: 3rem; text-align: center; color: #999; }
  </style>
</head>
<body>
  <h1>Claude Code Sessions</h1>
  ${sessions.length === 0
    ? '<div class="empty">No sessions found.</div>'
    : `<table>
      <thead><tr>
        <th>Project</th>
        <th>First Prompt</th>
        <th>Summary</th>
        <th style="text-align:right">Messages</th>
        <th>Modified</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`}
</body>
</html>`
}

export function sessionPage(sessionId: string, colorScheme: 'light' | 'dark'): string {
  const isDark = colorScheme === 'dark'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session ${sessionId}</title>
  <link rel="stylesheet" href="/assets/styles.css">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 2rem; background: ${isDark ? '#1a1a1a' : '#f5f5f5'}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .back { display: inline-block; margin-bottom: 1rem; color: ${isDark ? '#999' : '#666'}; text-decoration: none; font-size: 0.9rem; }
    .back:hover { color: ${isDark ? '#ccc' : '#333'}; }
  </style>
</head>
<body>
  <a class="back" href="/">&larr; Back to sessions</a>
  <div id="root"></div>
  <script>window.__SESSION_ID__ = "${sessionId}"; window.__COLOR_SCHEME__ = "${colorScheme}";</script>
  <script src="/assets/viewer.js"></script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}
