import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { useTranscriptContext } from '../context'

export function PermalinkButton({ blockId }: { blockId: string }) {
  const [copied, setCopied] = useState(false)
  const { generatePermalink, copyToClipboard } = useTranscriptContext()

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const defaultUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#event-${blockId}`
      : `#event-${blockId}`
    const url = generatePermalink ? generatePermalink(blockId) : defaultUrl

    if (copyToClipboard) {
      await copyToClipboard(url)
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="cct-rounded cct-p-1 cct-text-[var(--cct-text-muted)] cct-opacity-0 cct-transition-all hover:cct-bg-[var(--cct-bg-code)] hover:cct-text-[var(--cct-text-secondary)] group-hover:cct-opacity-100"
      title="Copy link to this block"
    >
      {copied ? (
        <Check className="cct-h-3.5 cct-w-3.5 cct-text-[var(--cct-success)]" />
      ) : (
        <Link2 className="cct-h-3.5 cct-w-3.5" />
      )}
    </button>
  )
}
