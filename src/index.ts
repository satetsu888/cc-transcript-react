import './react/styles.css'

export { ClaudeCodeTranscript } from './react/ClaudeCodeTranscript'
export type { ClaudeCodeTranscriptProps } from './react/ClaudeCodeTranscript'

export type {
  TranscriptEvent,
  DisplayBlock,
  BlockLabel,
} from './core/types'
export type {
  ColorScheme,
  TranscriptClassNames,
  TranscriptTheme,
} from './react/types'
export type { MessageBlockInfo } from './core/expand-events'

export { filterHiddenEvents } from './core/filter-events'
export { expandEvents, extractMessageBlocks } from './core/expand-events'
