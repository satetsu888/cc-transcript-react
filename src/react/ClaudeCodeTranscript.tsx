import { useMemo } from 'react'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from './cn'
import { filterHiddenEvents } from '../core/filter-events'
import { expandEvents } from '../core/expand-events'
import { TranscriptProvider, type TranscriptContextValue } from './context'
import { ContentBlockCard } from './components/ContentBlockCard'
import type { TranscriptEvent, DisplayBlock } from '../core/types'
import type { ColorScheme, TranscriptClassNames, TranscriptTheme } from './types'

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
  /**
   * Callback to generate a permalink URL for a block.
   * If not provided, uses window.location + hash fragment.
   */
  generatePermalink?: (blockId: string) => string
  /**
   * Callback to copy text to clipboard.
   * If not provided, uses navigator.clipboard.writeText.
   */
  copyToClipboard?: (text: string) => Promise<void>
}

export function ClaudeCodeTranscript({
  events,
  projectPath,
  colorScheme = 'light',
  className,
  classNames,
  theme,
  customBlockRenderers,
  generatePermalink,
  copyToClipboard,
}: ClaudeCodeTranscriptProps) {
  const displayBlocks = useMemo(() => {
    const filtered = filterHiddenEvents(events)
    return expandEvents(filtered, projectPath)
  }, [events, projectPath])

  const resolvedCodeTheme = useMemo(() => {
    if (theme?.codeTheme) return theme.codeTheme
    return colorScheme === 'dark' ? oneDark : oneLight
  }, [theme?.codeTheme, colorScheme])

  const contextValue = useMemo<TranscriptContextValue>(() => ({
    colorScheme,
    classNames,
    codeTheme: resolvedCodeTheme,
    codeCustomStyle: theme?.codeCustomStyle,
    customBlockRenderers,
    generatePermalink,
    copyToClipboard,
  }), [colorScheme, classNames, resolvedCodeTheme, theme?.codeCustomStyle, customBlockRenderers, generatePermalink, copyToClipboard])

  if (displayBlocks.length === 0) {
    return (
      <TranscriptProvider value={contextValue}>
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
      </TranscriptProvider>
    )
  }

  return (
    <TranscriptProvider value={contextValue}>
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
            <ContentBlockCard block={block} />
          </div>
        ))}
      </div>
    </TranscriptProvider>
  )
}
