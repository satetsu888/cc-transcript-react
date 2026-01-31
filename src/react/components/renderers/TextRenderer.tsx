import type { DisplayBlock } from '../../../core/types'
import { cn } from '../../cn'
import { useTranscriptContext } from '../../context'
import { MarkdownContent } from '../MarkdownContent'
import { PROSE_TEXT } from '../block-styles'

export function TextRenderer({ block }: { block: DisplayBlock }) {
  const { classNames } = useTranscriptContext()
  const content = block.content as Record<string, unknown>
  const text = typeof content === 'string' ? content : content?.text
  if (typeof text !== 'string') return null

  return (
    <MarkdownContent
      text={text}
      proseClass={cn(PROSE_TEXT, classNames?.markdown)}
    />
  )
}
