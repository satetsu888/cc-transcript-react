import type { TranscriptEvent, DisplayBlock, BlockLabel } from './types'

// --- Helpers ---

/** Get a stable key for an event. Uses consumer-provided key, falls back to uuid. */
function getEventKey(event: TranscriptEvent): string {
  return event.key ?? event.uuid
}

// --- Tool params extraction ---

type ToolParamsExtractor = (
  input: Record<string, unknown>,
  context: { projectPath?: string; cwd?: string }
) => string | undefined

const TOOL_PARAMS_EXTRACTORS: Record<string, ToolParamsExtractor> = {
  Read: (input, ctx) => {
    const filePath = input.file_path as string | undefined
    return filePath ? getDisplayPath(filePath, ctx.projectPath || ctx.cwd) : undefined
  },
  Edit: (input, ctx) => {
    const filePath = input.file_path as string | undefined
    return filePath ? getDisplayPath(filePath, ctx.projectPath || ctx.cwd) : undefined
  },
  Write: (input, ctx) => {
    const filePath = input.file_path as string | undefined
    return filePath ? getDisplayPath(filePath, ctx.projectPath || ctx.cwd) : undefined
  },
  Task: (input) => input.description as string | undefined,
  Bash: (input) => {
    const command = input.command as string | undefined
    if (!command) return undefined
    const maxLength = 50
    return command.length > maxLength ? command.slice(0, maxLength) + '...' : command
  },
  Glob: (input) => input.pattern as string | undefined,
  Grep: (input) => input.pattern as string | undefined,
}

function extractToolParams(
  toolName: string,
  input: Record<string, unknown> | undefined,
  context: { projectPath?: string; cwd?: string }
): string | undefined {
  if (!input) return undefined
  const extractor = TOOL_PARAMS_EXTRACTORS[toolName]
  return extractor ? extractor(input, context) : undefined
}

function getDisplayPath(filePath: string, cwd: string | undefined): string {
  if (!filePath) return ''
  if (!cwd) {
    return filePath.split('/').pop() || filePath
  }

  const normalizedCwd = cwd.replace(/\/+$/, '')
  const normalizedPath = filePath.replace(/\/+$/, '')

  if (normalizedPath.startsWith(normalizedCwd + '/')) {
    return normalizedPath.slice(normalizedCwd.length + 1)
  }

  const cwdParts = normalizedCwd.split('/')
  const pathParts = normalizedPath.split('/')

  let commonLength = 0
  for (let i = 0; i < Math.min(cwdParts.length, pathParts.length); i++) {
    if (cwdParts[i] === pathParts[i]) {
      commonLength = i + 1
    } else {
      break
    }
  }

  if (commonLength > 0) {
    const upCount = cwdParts.length - commonLength
    const remainingPath = pathParts.slice(commonLength).join('/')
    if (upCount <= 3) {
      return '../'.repeat(upCount) + remainingPath
    }
  }

  return filePath.split('/').pop() || filePath
}

// --- Local command helpers ---

function extractCommandName(content: string): string | null {
  const match = content.match(/<command-name>\/([\w-]+)<\/command-name>/)
  return match ? match[1] : null
}

function isLocalCommand(content: unknown): boolean {
  if (typeof content !== 'string') return false
  return content.trimStart().startsWith('<command-name>/')
}

function isLocalCommandOutput(content: unknown): boolean {
  if (typeof content !== 'string') return false
  return content.includes('<local-command-stdout>')
}

function isCompactSummary(event: TranscriptEvent): boolean {
  return event.payload?.isCompactSummary === true
}

function isMetaMessage(event: TranscriptEvent): boolean {
  return event.payload?.isMeta === true
}

// --- Grouping ---

function buildLocalCommandGroups(events: TranscriptEvent[]): Map<string, string> {
  const groups = new Map<string, string>()
  const userEvents = events.filter(e => e.event_type === 'user')

  const sortedEvents = [...userEvents].sort((a, b) => {
    const tsA = (a.payload?.timestamp as string) || a.created_at
    const tsB = (b.payload?.timestamp as string) || b.created_at
    return tsA.localeCompare(tsB)
  })

  const localCommandTimestamps = new Map<string, TranscriptEvent>()
  const localCommandKeys = new Set<string>()
  for (const event of sortedEvents) {
    const message = event.payload?.message as Record<string, unknown> | undefined
    const content = message?.content
    if (isLocalCommand(content)) {
      const ts = (event.payload?.timestamp as string) || event.created_at
      localCommandTimestamps.set(ts, event)
      localCommandKeys.add(getEventKey(event))
    }
  }

  let currentLocalCommand: TranscriptEvent | null = null

  for (const event of sortedEvents) {
    if (localCommandKeys.has(getEventKey(event))) {
      currentLocalCommand = event
      continue
    }

    const message = event.payload?.message as Record<string, unknown> | undefined
    const content = message?.content
    const eventTs = (event.payload?.timestamp as string) || event.created_at

    if (isMetaMessage(event)) {
      const matchingCommand = localCommandTimestamps.get(eventTs)
      if (matchingCommand) {
        groups.set(getEventKey(event), getEventKey(matchingCommand))
        continue
      }
    }

    if (currentLocalCommand) {
      if (isCompactSummary(event) || isMetaMessage(event) || isLocalCommandOutput(content)) {
        groups.set(getEventKey(event), getEventKey(currentLocalCommand))
      } else {
        currentLocalCommand = null
      }
    }
  }

  return groups
}

function buildToolResultMap(events: TranscriptEvent[]): Map<string, { content: unknown; timestamp: string; event: TranscriptEvent }> {
  const map = new Map<string, { content: unknown; timestamp: string; event: TranscriptEvent }>()

  for (const event of events) {
    if (event.event_type !== 'user') continue

    const message = event.payload?.message as Record<string, unknown> | undefined
    const content = message?.content
    const timestamp = (event.payload?.timestamp as string) || event.created_at

    if (Array.isArray(content)) {
      for (const block of content) {
        const blockObj = block as Record<string, unknown>
        if (blockObj?.type === 'tool_result' && typeof blockObj?.tool_use_id === 'string') {
          map.set(blockObj.tool_use_id, { content: block, timestamp, event })
        }
      }
    }
  }

  return map
}

function buildSkillContentMap(events: TranscriptEvent[]): Map<string, { content: unknown; timestamp: string; event: TranscriptEvent }> {
  const map = new Map<string, { content: unknown; timestamp: string; event: TranscriptEvent }>()

  for (const event of events) {
    if (event.event_type !== 'user') continue

    const isMeta = event.payload?.isMeta === true
    const sourceToolUseID = event.payload?.sourceToolUseID as string | undefined

    if (isMeta && sourceToolUseID) {
      const message = event.payload?.message as Record<string, unknown> | undefined
      const content = message?.content
      const timestamp = (event.payload?.timestamp as string) || event.created_at

      map.set(sourceToolUseID, { content, timestamp, event })
    }
  }

  return map
}

// --- Main expansion ---

/** Expand raw events into display blocks for rendering. */
export function expandEvents(events: TranscriptEvent[], projectPath?: string): DisplayBlock[] {
  const blocks: DisplayBlock[] = []

  const eventToCommandMap = buildLocalCommandGroups(events)
  const toolResultMap = buildToolResultMap(events)
  const skillContentMap = buildSkillContentMap(events)

  const groupedToolResultIds = new Set<string>()
  const groupedSkillContentEventKeys = new Set<string>()
  const relatedEventKeys = new Set(eventToCommandMap.keys())

  for (const event of events) {
    const key = getEventKey(event)
    const timestamp = (event.payload?.timestamp as string) || event.created_at
    const message = event.payload?.message as Record<string, unknown> | undefined
    const content = message?.content

    if (event.event_type === 'user') {
      if (relatedEventKeys.has(key)) continue
      if (groupedSkillContentEventKeys.has(key)) continue

      if (Array.isArray(content)) {
        content.forEach((block, i) => {
          const blockObj = block as Record<string, unknown>
          const blockType = blockObj?.type as string || 'text'

          if (blockType === 'tool_result') {
            const toolUseId = blockObj?.tool_use_id as string
            if (toolUseId && groupedToolResultIds.has(toolUseId)) {
              return
            }
          }

          blocks.push({
            id: `${key}-${i}`,
            eventType: 'user',
            blockType,
            label: { text: blockType === 'tool_result' ? 'Tool Result' : 'User' },
            timestamp,
            content: block,
            originalEvent: event,
          })
        })
      } else if (isLocalCommand(content)) {
        const commandName = extractCommandName(content as string) || 'command'

        const childBlocks: DisplayBlock[] = []
        for (const relatedEvent of events) {
          const commandId = eventToCommandMap.get(getEventKey(relatedEvent))
          if (commandId !== key) continue

          const childTimestamp = (relatedEvent.payload?.timestamp as string) || relatedEvent.created_at
          const childMessage = relatedEvent.payload?.message as Record<string, unknown> | undefined
          const childContent = childMessage?.content

          if (isCompactSummary(relatedEvent)) {
            childBlocks.push({
              id: getEventKey(relatedEvent),
              eventType: 'user',
              blockType: 'compact_summary',
              label: { text: 'Summary' },
              timestamp: childTimestamp,
              content: childContent,
              originalEvent: relatedEvent,
            })
          } else if (isMetaMessage(relatedEvent)) {
            continue
          } else if (isLocalCommandOutput(childContent)) {
            childBlocks.push({
              id: getEventKey(relatedEvent),
              eventType: 'user',
              blockType: 'local_command_output',
              label: { text: 'Output' },
              timestamp: childTimestamp,
              content: childContent,
              originalEvent: relatedEvent,
            })
          }
        }

        blocks.push({
          id: key,
          eventType: 'user',
          blockType: 'local_command_group',
          label: { text: `/${commandName}` },
          timestamp,
          content: content,
          originalEvent: event,
          childBlocks: childBlocks.length > 0 ? childBlocks : undefined,
        })
      } else if (isLocalCommandOutput(content)) {
        blocks.push({
          id: key,
          eventType: 'user',
          blockType: 'local_command_output',
          label: { text: 'Command Output' },
          timestamp,
          content: content,
          originalEvent: event,
        })
      } else {
        blocks.push({
          id: key,
          eventType: 'user',
          blockType: 'text',
          label: { text: 'User' },
          timestamp,
          content: content,
          originalEvent: event,
        })
      }
    } else if (event.event_type === 'assistant') {
      if (Array.isArray(content)) {
        content.forEach((block, i) => {
          const blockObj = block as Record<string, unknown>
          const blockType = blockObj?.type as string || 'text'
          let label: BlockLabel = { text: 'Assistant' }

          if (blockType === 'thinking') {
            const thinking = blockObj?.thinking as string | undefined
            const maxLength = 60
            const preview = thinking
              ? thinking.slice(0, maxLength) + (thinking.length > maxLength ? '...' : '')
              : undefined
            label = { text: 'Thinking', params: preview }
          } else if (blockType === 'tool_use') {
            const toolName = blockObj?.name as string || 'Unknown'
            const toolUseId = blockObj?.id as string
            const input = blockObj?.input as Record<string, unknown> | undefined
            const isSkill = toolName === 'Skill'

            if (isSkill) {
              const skillName = input?.skill as string || 'Unknown'
              label = { text: `Skill: ${skillName}` }
            } else {
              const params = extractToolParams(toolName, input, {
                projectPath,
                cwd: event.payload?.cwd as string | undefined,
              })
              label = { text: `Tool: ${toolName}`, params }
            }

            const toolResult = toolUseId ? toolResultMap.get(toolUseId) : undefined
            const skillContent = isSkill && toolUseId ? skillContentMap.get(toolUseId) : undefined

            if (toolResult) {
              groupedToolResultIds.add(toolUseId)

              if (skillContent) {
                groupedSkillContentEventKeys.add(getEventKey(skillContent.event))
              }

              const resultBlock: DisplayBlock = {
                id: `${key}-${i}-result`,
                eventType: 'user',
                blockType: 'tool_result',
                label: { text: 'Result' },
                timestamp: toolResult.timestamp,
                content: toolResult.content,
                originalEvent: toolResult.event,
              }

              let skillContentBlock: DisplayBlock | undefined
              if (skillContent) {
                skillContentBlock = {
                  id: `${key}-${i}-skill-content`,
                  eventType: 'user',
                  blockType: 'skill_content',
                  label: { text: 'Skill Content' },
                  timestamp: skillContent.timestamp,
                  content: skillContent.content,
                  originalEvent: skillContent.event,
                }
              }

              blocks.push({
                id: `${key}-${i}`,
                eventType: 'assistant',
                blockType: isSkill ? 'skill_group' : 'tool_group',
                label,
                timestamp,
                content: block,
                originalEvent: event,
                toolResultBlock: resultBlock,
                skillContentBlock: skillContentBlock,
              })
              return
            }
          } else if (blockType === 'tool_result') {
            label = { text: 'Tool Result' }
          } else if (blockType === 'text') {
            label = { text: 'Assistant' }
          } else {
            label = { text: `Assistant (${blockType})` }
          }

          blocks.push({
            id: `${key}-${i}`,
            eventType: 'assistant',
            blockType,
            label,
            timestamp,
            content: block,
            originalEvent: event,
          })
        })
      } else if (typeof content === 'string') {
        blocks.push({
          id: key,
          eventType: 'assistant',
          blockType: 'text',
          label: { text: 'Assistant' },
          timestamp,
          content: content,
          originalEvent: event,
        })
      } else {
        blocks.push({
          id: key,
          eventType: 'assistant',
          blockType: 'unknown',
          label: { text: 'Assistant' },
          timestamp,
          content: event.payload,
          originalEvent: event,
        })
      }
    } else if (event.event_type === 'tool_use' || event.event_type === 'tool_result') {
      const toolName = (event.payload as Record<string, unknown>)?.name as string || 'Unknown'
      blocks.push({
        id: key,
        eventType: event.event_type as 'tool_use' | 'tool_result',
        blockType: event.event_type,
        label: { text: event.event_type === 'tool_use' ? `Tool: ${toolName}` : 'Tool Result' },
        timestamp,
        content: event.payload,
        originalEvent: event,
      })
    }
  }

  return blocks
}

/** Message block info for navigation (user and assistant text messages). */
export interface MessageBlockInfo {
  id: string
  preview: string
  timestamp: string
  role: 'user' | 'assistant'
}

/** Extract message block info for navigation sidebar. */
export function extractMessageBlocks(blocks: DisplayBlock[]): MessageBlockInfo[] {
  return blocks
    .filter((block) =>
      (block.eventType === 'user' && block.blockType === 'text') ||
      (block.eventType === 'assistant' && block.blockType === 'text')
    )
    .map((block) => {
      let preview = ''
      const content = block.content
      if (typeof content === 'string') {
        preview = content
      } else if (content && typeof content === 'object') {
        const text = (content as Record<string, unknown>).text
        if (typeof text === 'string') {
          preview = text
        }
      }
      preview = preview.slice(0, 50) + (preview.length > 50 ? '...' : '')
      return {
        id: block.id,
        preview,
        timestamp: block.timestamp,
        role: block.eventType as 'user' | 'assistant',
      }
    })
}
