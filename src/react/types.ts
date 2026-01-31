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
