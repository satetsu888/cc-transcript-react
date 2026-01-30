import { useMemo } from 'react'
import { cn } from './cn'
import { filterHiddenEvents } from './filter-events'
import { expandEvents } from './expand-events'
import { ContentBlockCard } from './components/ContentBlockCard'
import type { TranscriptEvent, DisplayBlock, ColorScheme, TranscriptClassNames, TranscriptTheme } from './types'

export interface ClaudeCodeTranscriptProps {
  /** Array of raw transcript events from Claude Code. */
  events: TranscriptEvent[]
  /** Project path for resolving relative file paths in tool displays. */
  projectPath?: string
  /** Color scheme preset (default: 'light'). */
  colorScheme?: ColorScheme
  /** Additional CSS class name for the root container (shorthand for classNames.root). */
  className?: string
  /** Slot-based class name overrides. */
  classNames?: TranscriptClassNames
  /** Non-CSS theme settings (e.g., code highlight theme). */
  theme?: TranscriptTheme
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
  colorScheme = 'light',
  className,
  classNames,
  theme,
  customBlockRenderers,
}: ClaudeCodeTranscriptProps) {
  const displayBlocks = useMemo(() => {
    const filtered = filterHiddenEvents(events)
    return expandEvents(filtered, projectPath)
  }, [events, projectPath])

  if (displayBlocks.length === 0) {
    return (
      <div
        data-cct-root
        data-cct-theme={colorScheme}
        className={cn(
          'cct-rounded-[var(--cct-border-radius)] cct-border cct-border-dashed cct-border-[var(--cct-border-default)] cct-bg-[var(--cct-bg-primary)] cct-p-8 cct-text-center',
          classNames?.emptyState,
        )}
      >
        <p className="cct-text-[var(--cct-text-tertiary)]">No events.</p>
      </div>
    )
  }

  return (
    <div
      data-cct-root
      data-cct-theme={colorScheme}
      className={cn('cct-space-y-3', className, classNames?.root)}
    >
      {displayBlocks.map((block) => (
        <div
          key={block.id}
          id={`event-${block.id}`}
          className={cn('cct-scroll-mt-20', classNames?.blockWrapper)}
        >
          <ContentBlockCard
            block={block}
            colorScheme={colorScheme}
            classNames={classNames}
            theme={theme}
            customBlockRenderers={customBlockRenderers}
          />
        </div>
      ))}
    </div>
  )
}
