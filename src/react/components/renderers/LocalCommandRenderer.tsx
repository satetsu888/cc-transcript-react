import type { DisplayBlock } from '../../../core/types'
import { cn } from '../../cn'
import { useTranscriptContext } from '../../context'

function extractCommandOutput(content: string): string {
  const match = content.match(/<local-command-stdout>([\s\S]*?)<\/local-command-stdout>/)
  return match ? match[1].trim() : content
}

export function LocalCommandGroupRenderer({ block }: { block: DisplayBlock }) {
  const { classNames } = useTranscriptContext()

  return (
    <div className="cct-space-y-3">
      <div className="cct-text-sm cct-text-[var(--cct-text-tertiary)] cct-italic">Command executed</div>
      {block.childBlocks && block.childBlocks.length > 0 && (
        <div className="cct-space-y-2 cct-border-l-2 cct-border-[var(--cct-border-default)] cct-pl-3">
          {block.childBlocks.map((child) => (
            <div key={child.id}>
              <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">{child.label.text}</div>
              {child.blockType === 'local_command_output' ? (
                <pre className="cct-max-h-[200px] cct-overflow-auto cct-whitespace-pre-wrap cct-rounded-[var(--cct-border-radius-sm)] cct-bg-[var(--cct-bg-secondary)] cct-p-2 cct-font-mono cct-text-xs cct-text-[var(--cct-text-secondary)]">
                  {typeof child.content === 'string' ? extractCommandOutput(child.content) : ''}
                </pre>
              ) : child.blockType === 'compact_summary' ? (
                <div className="cct-max-h-[300px] cct-overflow-auto cct-rounded-[var(--cct-border-radius-sm)] cct-bg-[var(--cct-summary-bg)] cct-p-3 cct-text-xs cct-text-[var(--cct-text-body)]">
                  <pre className="cct-whitespace-pre-wrap cct-font-mono">
                    {typeof child.content === 'string' ? child.content : ''}
                  </pre>
                </div>
              ) : (
                <div className={cn('cct-prose cct-prose-sm cct-max-w-none cct-text-[var(--cct-text-secondary)]', classNames?.markdown)}>
                  {typeof child.content === 'string' ? child.content : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function LocalCommandRenderer() {
  return <div className="cct-text-sm cct-text-[var(--cct-text-tertiary)] cct-italic">Command executed</div>
}

export function LocalCommandOutputRenderer({ block }: { block: DisplayBlock }) {
  const output = typeof block.content === 'string' ? extractCommandOutput(block.content) : ''
  if (!output) {
    return <div className="cct-text-sm cct-text-[var(--cct-text-muted)] cct-italic">(no output)</div>
  }
  return (
    <pre className="cct-max-h-[300px] cct-overflow-auto cct-whitespace-pre-wrap cct-rounded-[var(--cct-border-radius-sm)] cct-bg-[var(--cct-bg-secondary)] cct-p-3 cct-font-mono cct-text-xs cct-text-[var(--cct-text-secondary)]">
      {output}
    </pre>
  )
}
