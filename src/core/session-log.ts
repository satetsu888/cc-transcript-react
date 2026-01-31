import type { TranscriptEvent } from './types'

/**
 * A raw entry from a Claude Code session JSONL file.
 * Contains the original fields as-is from the log.
 */
interface RawSessionEntry {
  type: string
  uuid?: string
  timestamp?: string
  [key: string]: unknown
}

/**
 * Parse a Claude Code session JSONL string into TranscriptEvent[].
 *
 * Each JSONL line is parsed and the entire entry is placed into `payload`
 * so that the existing expandEvents pipeline can read fields like
 * `payload.message`, `payload.timestamp`, `payload.isMeta`, etc.
 */
export function parseSessionLog(jsonlContent: string): TranscriptEvent[] {
  const lines = jsonlContent.split('\n').filter(line => line.trim() !== '')
  const events: TranscriptEvent[] = []

  for (const line of lines) {
    let entry: RawSessionEntry
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }

    if (!entry.type || !entry.uuid) continue

    events.push({
      uuid: entry.uuid,
      event_type: entry.type,
      payload: entry as Record<string, unknown>,
      created_at: entry.timestamp ?? '',
    })
  }

  return events
}
