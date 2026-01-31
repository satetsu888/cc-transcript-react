import type { DisplayBlock } from '../../../core/types'

export function FallbackRenderer({ block }: { block: DisplayBlock }) {
  return (
    <pre className="cct-max-h-[300px] cct-overflow-auto cct-whitespace-pre-wrap cct-text-xs cct-text-[var(--cct-text-secondary)]">
      {JSON.stringify(block.content, null, 2)}
    </pre>
  )
}
