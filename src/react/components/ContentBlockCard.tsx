import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../cn'
import { useTranscriptContext } from '../context'
import { isSecondaryBlock, shouldExpandByDefault } from './block-classification'
import { getBlockContainerStyle, getIcon, getIconStyle } from './block-styles'
import { PermalinkButton } from './PermalinkButton'
import { BlockContent } from './renderers'
import type { DisplayBlock } from '../../core/types'

export interface ContentBlockCardProps {
  block: DisplayBlock
}

export function ContentBlockCard({ block }: ContentBlockCardProps) {
  const { classNames } = useTranscriptContext()
  const isSecondary = isSecondaryBlock(block)
  const [expanded, setExpanded] = useState(() => shouldExpandByDefault(block))
  const styles = getBlockContainerStyle(block)

  if (!isSecondary) {
    return (
      <div className={cn(styles.wrapper, classNames?.blockWrapper)}>
        <div className={cn('cct-group cct-overflow-hidden cct-rounded-[var(--cct-border-radius)]', styles.container, classNames?.primaryBlock)}>
          <div className={cn('cct-flex cct-items-center cct-justify-between', styles.header, classNames?.primaryHeader)}>
            <div className="cct-flex cct-items-center cct-gap-2">
              <span className={cn('cct-flex cct-h-6 cct-w-6 cct-items-center cct-justify-center cct-rounded-full', getIconStyle(block), classNames?.icon)}>
                {getIcon(block)}
              </span>
              <span className={cn('cct-font-medium cct-text-[var(--cct-text-primary)]', classNames?.label)}>{block.label.text}</span>
            </div>
            <div className={cn('cct-flex cct-items-center cct-gap-2 cct-text-sm cct-text-[var(--cct-text-tertiary)]', classNames?.timestamp)}>
              <span>{format(new Date(block.timestamp), 'HH:mm:ss')}</span>
              <PermalinkButton blockId={block.id} />
            </div>
          </div>
          <div className={cn('cct-border-t cct-border-[var(--cct-border-subtle)] cct-px-4 cct-py-3', classNames?.primaryContent)}>
            <BlockContent block={block} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(styles.wrapper, classNames?.blockWrapper)}>
      <div className={cn('cct-group cct-overflow-hidden cct-rounded-[var(--cct-border-radius)]', styles.container, classNames?.secondaryBlock)}>
        <div className={cn('cct-flex cct-w-full cct-items-center cct-justify-between', styles.header, classNames?.secondaryHeader)}>
          <button
            className="cct-appearance-none cct-border-0 cct-bg-transparent cct-flex cct-flex-1 cct-items-center cct-gap-2 cct-text-left cct-transition-colors hover:cct-bg-[var(--cct-bg-secondary)]"
            onClick={() => setExpanded(!expanded)}
          >
            <span className={cn('cct-flex cct-h-5 cct-w-5 cct-items-center cct-justify-center cct-rounded-full', getIconStyle(block), classNames?.icon)}>
              {getIcon(block)}
            </span>
            <span className={cn('cct-text-sm cct-font-medium cct-text-[var(--cct-text-secondary)]', classNames?.label)}>{block.label.text}</span>
            {block.label.params && (
              <code className="cct-rounded cct-bg-[var(--cct-bg-code)] cct-px-1 cct-py-0.5 cct-text-xs cct-font-normal cct-text-[var(--cct-text-body)]">
                {block.label.params}
              </code>
            )}
          </button>
          <div className={cn('cct-flex cct-items-center cct-gap-2 cct-text-xs cct-text-[var(--cct-text-tertiary)]', classNames?.timestamp)}>
            <span>{format(new Date(block.timestamp), 'HH:mm:ss')}</span>
            <PermalinkButton blockId={block.id} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="cct-appearance-none cct-border-0 cct-bg-transparent cct-p-0.5 hover:cct-bg-[var(--cct-bg-code)] cct-rounded"
            >
              {expanded ? (
                <ChevronDown className="cct-h-3 cct-w-3" />
              ) : (
                <ChevronRight className="cct-h-3 cct-w-3" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className={cn('cct-border-t cct-border-[var(--cct-border-subtle)] cct-px-3 cct-py-2', classNames?.secondaryContent)}>
            <BlockContent block={block} />
          </div>
        )}
      </div>
    </div>
  )
}
