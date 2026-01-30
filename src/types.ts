/** A single event from a Claude Code transcript. */
export interface TranscriptEvent {
  /** Consumer-provided key for React rendering. Falls back to uuid if not provided. */
  key?: string
  /** Claude Code's UUID for this event (unique per session). */
  uuid: string
  event_type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | string
  payload: Record<string, unknown>
  created_at: string
}

/** Label structure for display blocks. */
export interface BlockLabel {
  /** Main label text like 'User', 'Thinking', 'Tool: Edit'. */
  text: string
  /** Optional parameter to display (e.g., file path, command). */
  params?: string
}

/** An expanded block ready for display. */
export interface DisplayBlock {
  id: string
  eventType: 'user' | 'assistant' | 'tool_use' | 'tool_result'
  blockType: string
  label: BlockLabel
  timestamp: string
  content: unknown
  originalEvent: TranscriptEvent
  /** For grouped local commands and tool groups. */
  childBlocks?: DisplayBlock[]
  /** For tool_group: the paired result block. */
  toolResultBlock?: DisplayBlock
  /** For skill_group: the skill content block. */
  skillContentBlock?: DisplayBlock
}
