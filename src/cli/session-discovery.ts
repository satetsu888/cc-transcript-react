import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export interface SessionEntry {
  sessionId: string
  fullPath: string
  firstPrompt: string
  lastPrompt: string
  messageCount: number
  created: string
  modified: string
  gitBranch: string
  projectPath: string
}

interface SessionMetadata {
  firstPrompt: string
  lastPrompt: string
  created: string
  gitBranch: string
  projectPath: string
  messageCount: number
}

/**
 * Extract the text content from a user message's content field,
 * which can be either a string or an array of content blocks.
 */
function extractMessageText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block === 'object' && block !== null && 'type' in block && block.type === 'text' && 'text' in block) {
        return String(block.text)
      }
    }
  }
  return ''
}

/**
 * Parse a session JSONL file to extract metadata.
 * Reads the entire file to count user messages and extract first prompt info.
 */
function parseSessionMetadata(filePath: string): SessionMetadata | null {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  let firstPrompt = ''
  let lastPrompt = ''
  let created = ''
  let gitBranch = ''
  let projectPath = ''
  let messageCount = 0
  let foundFirstUser = false

  for (const line of lines) {
    if (!line.trim()) continue

    let obj: Record<string, unknown>
    try {
      obj = JSON.parse(line)
    } catch {
      continue
    }

    if (obj.type === 'last-prompt') {
      lastPrompt = String(obj.lastPrompt ?? '')
      continue
    }

    if (obj.type !== 'user') continue

    messageCount++

    if (!foundFirstUser) {
      foundFirstUser = true
      const message = obj.message as Record<string, unknown> | undefined
      if (message) {
        firstPrompt = extractMessageText(message.content)
      }
      created = String(obj.timestamp ?? '')
      gitBranch = String(obj.gitBranch ?? '')
      projectPath = String(obj.cwd ?? '')
    }
  }

  if (!foundFirstUser) return null

  return { firstPrompt, lastPrompt, created, gitBranch, projectPath, messageCount }
}

/**
 * Decode a project directory name back to a filesystem path.
 * e.g. "-Users-satetsu888-work-aqua-cli" → "/Users/satetsu888/work/aqua-cli"
 *
 * Note: This is lossy for paths containing hyphens. Used only as a fallback.
 */
function decodeProjectPath(dirName: string): string {
  return dirName.replace(/-/g, '/')
}

/**
 * Discover all Claude Code sessions from ~/.claude/projects/.
 * Scans for .jsonl session files in each project directory.
 */
export function discoverSessions(): SessionEntry[] {
  const claudeDir = path.join(os.homedir(), '.claude', 'projects')

  if (!fs.existsSync(claudeDir)) return []

  const projectDirs = fs.readdirSync(claudeDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(claudeDir, d.name))

  const allSessions: SessionEntry[] = []

  for (const dir of projectDirs) {
    const dirName = path.basename(dir)

    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }

    const jsonlFiles = entries.filter(e => e.isFile() && e.name.endsWith('.jsonl'))

    for (const file of jsonlFiles) {
      const fullPath = path.join(dir, file.name)
      const sessionId = file.name.replace(/\.jsonl$/, '')

      try {
        const stat = fs.statSync(fullPath)
        const modified = stat.mtime.toISOString()

        const metadata = parseSessionMetadata(fullPath)

        allSessions.push({
          sessionId,
          fullPath,
          firstPrompt: metadata?.firstPrompt ?? '',
          lastPrompt: metadata?.lastPrompt ?? '',
          messageCount: metadata?.messageCount ?? 0,
          created: metadata?.created ?? modified,
          modified,
          gitBranch: metadata?.gitBranch ?? '',
          projectPath: metadata?.projectPath || decodeProjectPath(dirName),
        })
      } catch {
        // Skip unreadable files
      }
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
