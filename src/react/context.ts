import { createContext, useContext } from 'react'
import type { ColorScheme, TranscriptClassNames } from './types'
import type { DisplayBlock } from '../core/types'

export interface TranscriptContextValue {
  colorScheme: ColorScheme
  classNames?: TranscriptClassNames
  codeTheme: Record<string, React.CSSProperties>
  codeCustomStyle?: React.CSSProperties
  customBlockRenderers?: Record<string, (block: DisplayBlock) => React.ReactNode | null>
  generatePermalink?: (blockId: string) => string
  copyToClipboard?: (text: string) => Promise<void>
}

const TranscriptContext = createContext<TranscriptContextValue | null>(null)

export const TranscriptProvider = TranscriptContext.Provider

export function useTranscriptContext(): TranscriptContextValue {
  const ctx = useContext(TranscriptContext)
  if (!ctx) {
    throw new Error('useTranscriptContext must be used within a TranscriptProvider')
  }
  return ctx
}
