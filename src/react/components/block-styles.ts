import type { DisplayBlock } from '../../core/types'
import {
  User, Bot, Wrench, Sparkles, Terminal,
} from 'lucide-react'
import { createElement } from 'react'
import { isSecondaryBlock } from './block-classification'

// --- Prose class constants ---

const PROSE_BASE = 'cct-prose cct-prose-sm cct-max-w-none'

const PROSE_CODE_RESET = 'prose-code:cct-rounded prose-code:cct-px-1 prose-code:cct-py-0.5 prose-code:before:cct-content-none prose-code:after:cct-content-none'

// Overrides for all --tw-prose-* color variables so the component works in both
// light and dark mode without needing prose-invert.
const PROSE_COLOR_OVERRIDES = [
  'prose-strong:cct-text-[var(--cct-text-primary)]',
  'prose-a:cct-text-[var(--cct-text-primary)] prose-a:cct-underline',
  'prose-blockquote:cct-text-[var(--cct-text-secondary)] prose-blockquote:cct-border-[var(--cct-border-default)]',
  'prose-hr:cct-border-[var(--cct-border-default)]',
  'prose-th:cct-border-[var(--cct-border-default)] prose-td:cct-border-[var(--cct-border-default)]',
  'prose-figcaption:cct-text-[var(--cct-text-tertiary)]',
  'prose-kbd:cct-text-[var(--cct-text-primary)]',
].join(' ')

export const PROSE_TEXT = `${PROSE_BASE} cct-text-[var(--cct-text-body)] prose-headings:cct-text-[var(--cct-text-primary)] ${PROSE_COLOR_OVERRIDES} ${PROSE_CODE_RESET} prose-code:cct-bg-[var(--cct-bg-code)] prose-code:cct-text-[var(--cct-text-primary)] prose-pre:cct-bg-[var(--cct-bg-code)] prose-pre:cct-text-[var(--cct-text-primary)]`

export const PROSE_THINKING = `${PROSE_BASE} cct-text-[var(--cct-thinking-text)] prose-headings:cct-text-[var(--cct-thinking-text)] prose-strong:cct-text-[var(--cct-thinking-text)] prose-a:cct-text-[var(--cct-thinking-text)] prose-a:cct-underline prose-blockquote:cct-text-[var(--cct-thinking-text)] prose-blockquote:cct-border-[var(--cct-thinking-code-bg)] prose-hr:cct-border-[var(--cct-thinking-code-bg)] prose-kbd:cct-text-[var(--cct-thinking-text)] ${PROSE_CODE_RESET} prose-code:cct-bg-[var(--cct-thinking-code-bg)] prose-code:cct-text-[var(--cct-thinking-code-text)] prose-pre:cct-bg-[var(--cct-thinking-pre-bg)] prose-pre:cct-text-[var(--cct-thinking-text)]`

export const PROSE_SKILL = `${PROSE_BASE} prose-headings:cct-mt-3 prose-headings:cct-mb-2 prose-p:cct-my-1 prose-ul:cct-my-1 prose-ol:cct-my-1 prose-li:cct-my-0.5 prose-pre:cct-my-2`

// --- Container styles ---

export function getBlockContainerStyle(block: DisplayBlock) {
  if (isSecondaryBlock(block)) {
    return {
      wrapper: 'cct-ml-4',
      container: 'cct-border cct-border-[var(--cct-border-default)] cct-bg-[var(--cct-bg-secondary)]',
      header: 'cct-px-3 cct-py-2',
    }
  }
  const borderColor = block.eventType === 'user'
    ? 'cct-border-[var(--cct-user-border)]'
    : 'cct-border-[var(--cct-assistant-border)]'
  const bgColor = block.eventType === 'user'
    ? 'cct-bg-[var(--cct-user-bg)]'
    : 'cct-bg-[var(--cct-assistant-bg)]'
  return {
    wrapper: '',
    container: `cct-border-2 ${borderColor} ${bgColor}`,
    header: 'cct-px-4 cct-py-3',
  }
}

// --- Icons ---

const ICON_CLASS = 'cct-h-4 cct-w-4'

function icon(component: React.FC<{ className?: string }>) {
  return createElement(component, { className: ICON_CLASS })
}

export function getIcon(block: DisplayBlock): React.ReactElement {
  if (block.blockType === 'local_command' || block.blockType === 'local_command_output' || block.blockType === 'local_command_group') {
    return icon(Terminal)
  }
  if (block.blockType === 'skill_group') {
    return icon(Sparkles)
  }
  if (block.blockType === 'tool_use' || block.blockType === 'tool_result' || block.blockType === 'tool_group') {
    return icon(Wrench)
  }
  if (block.eventType === 'tool_use' || block.eventType === 'tool_result') {
    return icon(Wrench)
  }
  if (block.blockType === 'thinking') {
    return icon(Sparkles)
  }
  if (block.eventType === 'user') {
    return icon(User)
  }
  return icon(Bot)
}

export function getIconStyle(block: DisplayBlock): string {
  if (isSecondaryBlock(block)) {
    return 'cct-bg-[var(--cct-secondary-icon-bg)] cct-text-[var(--cct-text-tertiary)]'
  }
  if (block.eventType === 'user') {
    return 'cct-bg-[var(--cct-user-icon-bg)] cct-text-[var(--cct-user-icon-text)]'
  }
  return 'cct-bg-[var(--cct-assistant-icon-bg)] cct-text-[var(--cct-assistant-icon-text)]'
}
