import type { TranscriptEvent } from './types'

/**
 * Event types that should be hidden from display.
 * These are internal Claude Code events not useful for transcript viewing.
 */
const HIDDEN_EVENT_TYPES = [
  'file-history-snapshot',
  'system',
  'summary',
  'progress',
]

/** Filter out hidden event types from a list of transcript events. */
export function filterHiddenEvents(events: TranscriptEvent[]): TranscriptEvent[] {
  return events.filter(e => !HIDDEN_EVENT_TYPES.includes(e.event_type))
}
