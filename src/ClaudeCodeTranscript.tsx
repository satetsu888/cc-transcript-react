import { useMemo } from 'react'
import { cn } from './cn'
import { filterHiddenEvents } from './filter-events'
import { expandEvents } from './expand-events'
import { ContentBlockCard } from './components/ContentBlockCard'
import type { TranscriptEvent, DisplayBlock } from './types'

export interface ClaudeCodeTranscriptProps {
  /** Array of raw transcript events from Claude Code. */
  events: TranscriptEvent[]
  /** Project path for resolving relative file paths in tool displays. */
  projectPath?: string
  /** Additional CSS class name for the root container. */
  className?: string
  /**
   * Custom block renderers keyed by blockType or tool name.
   *
   * For `tool_group` blocks, the tool name is checked first, then the blockType.
   * Return `null` to fall back to the default renderer.
   *
   * @example
   * ```tsx
   * <ClaudeCodeTranscript
   *   events={events}
   *   customBlockRenderers={{
   *     'mcp__myserver__my_tool': (block) => <MyToolCard block={block} />,
   *   }}
   * />
   * ```
   */
  customBlockRenderers?: Record<string, (block: DisplayBlock) => React.ReactNode | null>
}

export function ClaudeCodeTranscript({
  events,
  projectPath,
  className,
  customBlockRenderers,
}: ClaudeCodeTranscriptProps) {
  const displayBlocks = useMemo(() => {
    const filtered = filterHiddenEvents(events)
    return expandEvents(filtered, projectPath)
  }, [events, projectPath])

  if (displayBlocks.length === 0) {
    return (
      <div className="cct-rounded-xl cct-border cct-border-dashed cct-border-gray-300 cct-bg-white cct-p-8 cct-text-center">
        <p className="cct-text-gray-500">No events.</p>
      </div>
    )
  }

  return (
    <div className={cn('cct-space-y-3', className)}>
      {displayBlocks.map((block) => (
        <div key={block.id} id={`event-${block.id}`} className="cct-scroll-mt-20">
          <ContentBlockCard block={block} customBlockRenderers={customBlockRenderers} />
        </div>
      ))}
    </div>
  )
}
