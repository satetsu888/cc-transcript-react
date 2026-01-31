import type { DisplayBlock } from '../../../core/types'
import { cn } from '../../cn'
import { useTranscriptContext } from '../../context'
import { MarkdownContent } from '../MarkdownContent'
import { PROSE_THINKING } from '../block-styles'

export function ThinkingRenderer({ block }: { block: DisplayBlock }) {
  const { classNames } = useTranscriptContext()
  const content = block.content as Record<string, unknown>
  const thinking = content?.thinking as string

  return (
    <MarkdownContent
      text={thinking}
      proseClass={cn(PROSE_THINKING, classNames?.markdown)}
    />
  )
}
