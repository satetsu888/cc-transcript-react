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

/** Color scheme preset. */
export type ColorScheme = 'light' | 'dark'

/** Slot-based class name overrides for transcript components. */
export interface TranscriptClassNames {
  /** Root container */
  root?: string
  /** Empty state display */
  emptyState?: string
  /** Outer wrapper for each block */
  blockWrapper?: string
  /** Primary block container (User/Assistant text messages) */
  primaryBlock?: string
  /** Primary block header */
  primaryHeader?: string
  /** Primary block content area */
  primaryContent?: string
  /** Secondary block container (Thinking, Tool, etc.) */
  secondaryBlock?: string
  /** Secondary block header */
  secondaryHeader?: string
  /** Secondary block content area */
  secondaryContent?: string
  /** Markdown content wrapper (prose) */
  markdown?: string
  /** Code block wrapper */
  codeBlock?: string
  /** Label text */
  label?: string
  /** Timestamp text */
  timestamp?: string
  /** Icon wrapper */
  icon?: string
}

/** Non-CSS theme settings. */
export interface TranscriptTheme {
  /** react-syntax-highlighter theme object (default: auto based on colorScheme). */
  codeTheme?: Record<string, React.CSSProperties>
  /** Custom inline style overrides for SyntaxHighlighter. */
  codeCustomStyle?: React.CSSProperties
}
