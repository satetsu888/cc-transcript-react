import type { DisplayBlock } from '../../core/types'

const SECONDARY_BLOCK_TYPES = [
  'thinking', 'tool_use', 'tool_result', 'tool_group', 'skill_group',
  'local_command', 'local_command_output', 'local_command_group',
]

export function isSecondaryBlock(block: DisplayBlock): boolean {
  return SECONDARY_BLOCK_TYPES.includes(block.blockType)
}

export function isTodoTool(toolName: string): boolean {
  return toolName === 'TodoWrite' || toolName === 'TodoRead'
}

export function isAskUserQuestionTool(toolName: string): boolean {
  return toolName === 'AskUserQuestion'
}

export function shouldExpandByDefault(block: DisplayBlock): boolean {
  if (!isSecondaryBlock(block)) return true
  if (block.blockType === 'tool_group') {
    const content = block.content as Record<string, unknown> | undefined
    const toolName = content?.name as string | undefined
    if (toolName && (isTodoTool(toolName) || isAskUserQuestionTool(toolName))) return true
  }
  return false
}
