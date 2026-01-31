import { Check } from 'lucide-react'
import type { DisplayBlock } from '../../../core/types'
import { joinContentText } from '../../../core/content-utils'
import { cn } from '../../cn'
import { useTranscriptContext } from '../../context'
import { MarkdownContent } from '../MarkdownContent'
import { CodeBlock } from '../CodeBlock'
import { PROSE_SKILL } from '../block-styles'

export function SkillGroupRenderer({ block }: { block: DisplayBlock }) {
  const { classNames } = useTranscriptContext()
  const content = block.content as Record<string, unknown>
  const input = content?.input as Record<string, unknown> | undefined
  const resultBlock = block.toolResultBlock
  const resultContent = resultBlock?.content as Record<string, unknown> | undefined
  const resultData = resultContent?.content as string | undefined
  const skillContentBlock = block.skillContentBlock
  const skillContent = skillContentBlock?.content

  const skillText = joinContentText(skillContent)

  return (
    <div className="cct-space-y-3">
      {resultData && (
        <div className="cct-flex cct-items-center cct-gap-2 cct-text-sm">
          <Check className="cct-h-4 cct-w-4 cct-text-[var(--cct-success)]" />
          <span className="cct-text-[var(--cct-text-secondary)]">{resultData}</span>
        </div>
      )}
      {skillText && (
        <div className="cct-border cct-border-[var(--cct-border-default)] cct-rounded-[var(--cct-border-radius-sm)] cct-p-3 cct-bg-[var(--cct-bg-primary)]">
          <div className="cct-mb-2 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">Skill Content</div>
          <MarkdownContent
            text={skillText}
            proseClass={cn(PROSE_SKILL, classNames?.markdown)}
          />
        </div>
      )}
      {!skillText && (
        <div>
          <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">Input</div>
          <CodeBlock maxHeight="200px">{JSON.stringify(input, null, 2)}</CodeBlock>
        </div>
      )}
    </div>
  )
}
