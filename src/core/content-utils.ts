/**
 * Extract text from a single content block.
 * Handles both plain strings and { type: 'text', text: '...' } objects.
 */
export function extractTextFromContentBlock(
  block: unknown,
  fallback: (block: unknown) => string = () => '',
): string {
  if (typeof block === 'string') return block
  if (block && typeof block === 'object') {
    const obj = block as Record<string, unknown>
    if (obj.type === 'text' && typeof obj.text === 'string') return obj.text
  }
  return fallback(block)
}

/**
 * Join text from a content value (string or array of content blocks).
 */
export function joinContentText(
  content: unknown,
  options?: { separator?: string; fallback?: (block: unknown) => string },
): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(c => extractTextFromContentBlock(c, options?.fallback))
      .filter(Boolean)
      .join(options?.separator ?? '\n')
  }
  return ''
}
