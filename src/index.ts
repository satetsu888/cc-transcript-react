import './styles.css'

export { ClaudeCodeTranscript } from './ClaudeCodeTranscript'
export type { ClaudeCodeTranscriptProps } from './ClaudeCodeTranscript'

export type {
  TranscriptEvent,
  DisplayBlock,
  BlockLabel,
  ColorScheme,
  TranscriptClassNames,
  TranscriptTheme,
} from './types'
export type { MessageBlockInfo } from './expand-events'

export { filterHiddenEvents } from './filter-events'
export { expandEvents, extractMessageBlocks } from './expand-events'
