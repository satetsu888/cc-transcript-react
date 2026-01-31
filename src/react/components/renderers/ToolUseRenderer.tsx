import type { DisplayBlock } from '../../../core/types'
import { joinContentText } from '../../../core/content-utils'
import { CodeBlock } from '../CodeBlock'

export function ToolUseRenderer({ block }: { block: DisplayBlock }) {
  const content = block.content as Record<string, unknown>
  const input = content?.input
  return (
    <CodeBlock maxHeight="400px">{JSON.stringify(input, null, 2)}</CodeBlock>
  )
}

export function ToolResultRenderer({ block }: { block: DisplayBlock }) {
  const content = block.content as Record<string, unknown>
  const resultContent = content?.content

  const displayContent = joinContentText(resultContent, {
    fallback: (c) => JSON.stringify(c, null, 2),
  }) || JSON.stringify(resultContent, null, 2)

  return (
    <CodeBlock maxHeight="400px">{displayContent}</CodeBlock>
  )
}

export function StandaloneToolEventRenderer({ block }: { block: DisplayBlock }) {
  const payload = block.content as Record<string, unknown>
  const input = payload?.input || payload?.result || payload
  return (
    <CodeBlock maxHeight="400px">{JSON.stringify(input, null, 2)}</CodeBlock>
  )
}
