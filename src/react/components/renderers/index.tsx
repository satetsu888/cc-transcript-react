import type { DisplayBlock } from '../../../core/types'
import { useTranscriptContext } from '../../context'
import { TextRenderer } from './TextRenderer'
import { ThinkingRenderer } from './ThinkingRenderer'
import { ToolGroupRenderer } from './ToolGroupRenderer'
import { SkillGroupRenderer } from './SkillGroupRenderer'
import { LocalCommandGroupRenderer, LocalCommandRenderer, LocalCommandOutputRenderer } from './LocalCommandRenderer'
import { ToolUseRenderer, ToolResultRenderer, StandaloneToolEventRenderer } from './ToolUseRenderer'
import { FallbackRenderer } from './FallbackRenderer'

type BlockRendererComponent = React.FC<{ block: DisplayBlock }>

const DEFAULT_RENDERERS: Record<string, BlockRendererComponent> = {
  text: TextRenderer,
  thinking: ThinkingRenderer,
  tool_group: ToolGroupRenderer,
  skill_group: SkillGroupRenderer,
  local_command_group: LocalCommandGroupRenderer,
  local_command: LocalCommandRenderer,
  local_command_output: LocalCommandOutputRenderer,
  tool_use: ToolUseRenderer,
  tool_result: ToolResultRenderer,
}

export function BlockContent({ block }: { block: DisplayBlock }) {
  const { customBlockRenderers } = useTranscriptContext()

  // Check custom renderer by tool name (for tool_group blocks)
  if (customBlockRenderers && block.blockType === 'tool_group') {
    const content = block.content as Record<string, unknown> | undefined
    const toolName = content?.name as string | undefined
    if (toolName && customBlockRenderers[toolName]) {
      const result = customBlockRenderers[toolName](block)
      if (result !== null) return <>{result}</>
    }
  }

  // Check custom renderer by blockType
  if (customBlockRenderers && customBlockRenderers[block.blockType]) {
    const result = customBlockRenderers[block.blockType](block)
    if (result !== null) return <>{result}</>
  }

  // Standalone tool_use/tool_result events (eventType-level, not blockType-level)
  if (block.eventType === 'tool_use' || block.eventType === 'tool_result') {
    if (!DEFAULT_RENDERERS[block.blockType]) {
      return <StandaloneToolEventRenderer block={block} />
    }
  }

  const Renderer = DEFAULT_RENDERERS[block.blockType]
  if (Renderer) {
    return <Renderer block={block} />
  }

  return <FallbackRenderer block={block} />
}
