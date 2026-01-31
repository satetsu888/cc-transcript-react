import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export interface SessionEntry {
  sessionId: string
  fullPath: string
  firstPrompt: string
  summary: string
  messageCount: number
  created: string
  modified: string
  gitBranch: string
  projectPath: string
}

interface SessionsIndex {
  version: number
  entries: SessionEntry[]
}

/**
 * Discover all Claude Code sessions from ~/.claude/projects/.
 * Reads sessions-index.json from each project directory.
 */
export function discoverSessions(): SessionEntry[] {
  const claudeDir = path.join(os.homedir(), '.claude', 'projects')

  if (!fs.existsSync(claudeDir)) return []

  const projectDirs = fs.readdirSync(claudeDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(claudeDir, d.name))

  const allSessions: SessionEntry[] = []

  for (const dir of projectDirs) {
    const indexPath = path.join(dir, 'sessions-index.json')
    if (!fs.existsSync(indexPath)) continue

    try {
      const raw = fs.readFileSync(indexPath, 'utf-8')
      const index: SessionsIndex = JSON.parse(raw)
      if (index.entries) {
        allSessions.push(...index.entries)
      }
    } catch {
      // Skip unreadable index files
    }
  }

  // Sort by modified date descending (most recent first)
  allSessions.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())

  return allSessions
}

/**
 * Read a session's JSONL file content.
 */
export function readSessionFile(fullPath: string): string {
  return fs.readFileSync(fullPath, 'utf-8')
}
