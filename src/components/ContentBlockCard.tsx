import { cn } from '../cn'
import {
  User, Bot, Wrench, Sparkles, ChevronDown, ChevronRight,
  Terminal, Check, Circle, CheckCircle2, CircleDot,
  MessageCircleQuestion, Pencil, Link2,
} from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DisplayBlock } from '../types'

export interface ContentBlockCardProps {
  block: DisplayBlock
  customBlockRenderers?: Record<string, (block: DisplayBlock) => React.ReactNode | null>
}

// --- Block classification ---

const SECONDARY_BLOCK_TYPES = [
  'thinking', 'tool_use', 'tool_result', 'tool_group', 'skill_group',
  'local_command', 'local_command_output', 'local_command_group',
]

function isSecondaryBlock(block: DisplayBlock): boolean {
  return SECONDARY_BLOCK_TYPES.includes(block.blockType)
}

function isTodoTool(toolName: string): boolean {
  return toolName === 'TodoWrite' || toolName === 'TodoRead'
}

function isAskUserQuestionTool(toolName: string): boolean {
  return toolName === 'AskUserQuestion'
}

function shouldExpandByDefault(block: DisplayBlock): boolean {
  if (!isSecondaryBlock(block)) return true
  if (block.blockType === 'tool_group') {
    const content = block.content as Record<string, unknown> | undefined
    const toolName = content?.name as string | undefined
    if (toolName && (isTodoTool(toolName) || isAskUserQuestionTool(toolName))) return true
  }
  return false
}

// --- Styling ---

function getBlockContainerStyle(block: DisplayBlock) {
  if (isSecondaryBlock(block)) {
    return {
      wrapper: 'cct-ml-4',
      container: 'cct-border cct-border-gray-200 cct-bg-gray-50/50',
      header: 'cct-px-3 cct-py-2',
    }
  }
  const borderColor = block.eventType === 'user' ? 'cct-border-blue-200' : 'cct-border-green-200'
  return {
    wrapper: '',
    container: `cct-border-2 ${borderColor} cct-bg-white`,
    header: 'cct-px-4 cct-py-3',
  }
}

function getIcon(block: DisplayBlock) {
  if (block.blockType === 'local_command' || block.blockType === 'local_command_output' || block.blockType === 'local_command_group') {
    return <Terminal className="cct-h-4 cct-w-4" />
  }
  if (block.blockType === 'skill_group') {
    return <Sparkles className="cct-h-4 cct-w-4" />
  }
  if (block.blockType === 'tool_use' || block.blockType === 'tool_result' || block.blockType === 'tool_group') {
    return <Wrench className="cct-h-4 cct-w-4" />
  }
  if (block.eventType === 'tool_use' || block.eventType === 'tool_result') {
    return <Wrench className="cct-h-4 cct-w-4" />
  }
  if (block.blockType === 'thinking') {
    return <Sparkles className="cct-h-4 cct-w-4" />
  }
  if (block.eventType === 'user') {
    return <User className="cct-h-4 cct-w-4" />
  }
  return <Bot className="cct-h-4 cct-w-4" />
}

function getIconStyle(block: DisplayBlock) {
  if (isSecondaryBlock(block)) {
    return 'cct-bg-gray-200 cct-text-gray-500'
  }
  if (block.eventType === 'user') {
    return 'cct-bg-blue-100 cct-text-blue-600'
  }
  return 'cct-bg-green-100 cct-text-green-600'
}

// --- Specialized tool helpers ---

interface TodoItem {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  activeForm?: string
  priority?: 'high' | 'medium' | 'low'
}

interface AskUserQuestionOption {
  label: string
  description: string
}

interface AskUserQuestionItem {
  header: string
  question: string
  multiSelect: boolean
  options: AskUserQuestionOption[]
}

function extractTodos(toolName: string, input: unknown, resultContent: unknown): TodoItem[] | null {
  if (toolName === 'TodoWrite') {
    const inputObj = input as { todos?: TodoItem[] } | undefined
    if (inputObj?.todos && Array.isArray(inputObj.todos)) {
      return inputObj.todos
    }
  }
  if (toolName === 'TodoRead') {
    if (resultContent) {
      let parsed = resultContent
      if (typeof resultContent === 'string') {
        try { parsed = JSON.parse(resultContent) } catch { return null }
      }
      const resultObj = parsed as { todos?: TodoItem[] } | TodoItem[]
      if (Array.isArray(resultObj)) return resultObj as TodoItem[]
      if (resultObj && 'todos' in resultObj && Array.isArray(resultObj.todos)) return resultObj.todos
    }
  }
  return null
}

function extractAskUserQuestions(input: unknown): AskUserQuestionItem[] | null {
  const inputObj = input as { questions?: AskUserQuestionItem[] } | undefined
  if (inputObj?.questions && Array.isArray(inputObj.questions)) return inputObj.questions
  return null
}

function parseUserAnswers(resultContent: unknown): Record<string, string> {
  const answers: Record<string, string> = {}
  let contentStr: string
  if (typeof resultContent === 'string') {
    contentStr = resultContent
  } else if (Array.isArray(resultContent)) {
    contentStr = resultContent
      .map((c) => {
        if (typeof c === 'string') return c
        if (c?.type === 'text' && typeof c.text === 'string') return c.text
        return ''
      })
      .join('')
  } else {
    return answers
  }
  const regex = /"([^"]+)"="([^"]+)"/g
  let match
  while ((match = regex.exec(contentStr)) !== null) {
    answers[match[1]] = match[2]
  }
  return answers
}

function isOptionSelected(answer: string, options: AskUserQuestionOption[]): boolean {
  return options.some(opt => opt.label === answer)
}

function extractCommandOutput(content: string): string {
  const match = content.match(/<local-command-stdout>([\s\S]*?)<\/local-command-stdout>/)
  return match ? match[1].trim() : content
}

// --- Sub-components ---

function TodoListBlock({ todos }: { todos: TodoItem[] }) {
  if (todos.length === 0) {
    return <div className="cct-text-sm cct-text-gray-500 cct-italic">No tasks</div>
  }
  return (
    <div className="cct-space-y-1.5">
      {todos.map((todo, i) => (
        <div key={i} className="cct-flex cct-items-start cct-gap-2">
          {todo.status === 'completed' && (
            <CheckCircle2 className="cct-h-4 cct-w-4 cct-text-green-500 cct-flex-shrink-0 cct-mt-0.5" />
          )}
          {todo.status === 'in_progress' && (
            <CircleDot className="cct-h-4 cct-w-4 cct-text-blue-500 cct-flex-shrink-0 cct-mt-0.5" />
          )}
          {todo.status === 'pending' && (
            <Circle className="cct-h-4 cct-w-4 cct-text-gray-400 cct-flex-shrink-0 cct-mt-0.5" />
          )}
          <span
            className={cn(
              'cct-text-sm',
              todo.status === 'completed' && 'cct-text-gray-500 cct-line-through',
              todo.status === 'in_progress' && 'cct-text-blue-700 cct-font-medium',
              todo.status === 'pending' && 'cct-text-gray-700'
            )}
          >
            {todo.content}
          </span>
        </div>
      ))}
    </div>
  )
}

function AskUserQuestionBlock({
  questions,
  answers,
}: {
  questions: AskUserQuestionItem[]
  answers: Record<string, string>
}) {
  if (questions.length === 0) {
    return <div className="cct-text-sm cct-text-gray-500 cct-italic">No questions</div>
  }
  return (
    <div className="cct-space-y-4">
      {questions.map((q, i) => {
        const answer = answers[q.question]
        const isOtherAnswer = answer && !isOptionSelected(answer, q.options)
        return (
          <div key={i} className="cct-rounded-lg cct-border cct-border-gray-200 cct-bg-white cct-p-3">
            <div className="cct-mb-1 cct-flex cct-items-center cct-gap-1.5 cct-text-xs cct-font-medium cct-text-gray-500">
              <MessageCircleQuestion className="cct-h-3.5 cct-w-3.5" />
              {q.header}
            </div>
            <div className="cct-mb-3 cct-font-medium cct-text-gray-900">{q.question}</div>
            <div className="cct-space-y-2">
              {q.options.map((opt, j) => {
                const isSelected = answer === opt.label
                return (
                  <div
                    key={j}
                    className={cn(
                      'cct-flex cct-items-start cct-gap-2 cct-rounded-md cct-p-2 cct-transition-colors',
                      isSelected && 'cct-bg-blue-50'
                    )}
                  >
                    {isSelected ? (
                      <CircleDot className="cct-mt-0.5 cct-h-4 cct-w-4 cct-flex-shrink-0 cct-text-blue-500" />
                    ) : (
                      <Circle className="cct-mt-0.5 cct-h-4 cct-w-4 cct-flex-shrink-0 cct-text-gray-300" />
                    )}
                    <div className="cct-min-w-0 cct-flex-1">
                      <span className={cn('cct-text-sm', isSelected ? 'cct-font-medium cct-text-blue-700' : 'cct-text-gray-700')}>
                        {opt.label}
                      </span>
                      {opt.description && (
                        <p className="cct-mt-0.5 cct-text-xs cct-text-gray-500">{opt.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {isOtherAnswer && (
                <div className="cct-mt-2 cct-flex cct-items-start cct-gap-2 cct-rounded-md cct-border-t cct-border-gray-100 cct-bg-blue-50 cct-p-2 cct-pt-3">
                  <Pencil className="cct-mt-0.5 cct-h-4 cct-w-4 cct-flex-shrink-0 cct-text-blue-500" />
                  <div className="cct-min-w-0 cct-flex-1">
                    <span className="cct-text-xs cct-font-medium cct-text-gray-500">Other</span>
                    <p className="cct-text-sm cct-font-medium cct-text-blue-700">{answer}</p>
                  </div>
                </div>
              )}
              {!answer && (
                <div className="cct-mt-2 cct-text-xs cct-italic cct-text-gray-400">Waiting for answer...</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PermalinkButton({ blockId }: { blockId: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}${window.location.pathname}#event-${blockId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="cct-rounded cct-p-1 cct-text-gray-400 cct-opacity-0 cct-transition-all hover:cct-bg-gray-100 hover:cct-text-gray-600 group-hover:cct-opacity-100"
      title="Copy link to this block"
    >
      {copied ? (
        <Check className="cct-h-3.5 cct-w-3.5 cct-text-green-500" />
      ) : (
        <Link2 className="cct-h-3.5 cct-w-3.5" />
      )}
    </button>
  )
}

// --- Markdown renderer helper ---

function MarkdownContent({ text, proseClass }: { text: string; proseClass: string }) {
  return (
    <div className={proseClass}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const code = String(children).replace(/\n$/, '')
            if (match) {
              return (
                <SyntaxHighlighter
                  language={match[1]}
                  style={oneLight}
                  customStyle={{ fontSize: '0.75rem', borderRadius: '0.5rem', margin: 0 }}
                >
                  {code}
                </SyntaxHighlighter>
              )
            }
            return (
              <code className={className} {...props}>{children}</code>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

// --- Content rendering ---

function renderContent(
  block: DisplayBlock,
  customBlockRenderers?: Record<string, (block: DisplayBlock) => React.ReactNode | null>,
) {
  // Check custom renderer by tool name (for tool_group blocks)
  if (customBlockRenderers && block.blockType === 'tool_group') {
    const content = block.content as Record<string, unknown> | undefined
    const toolName = content?.name as string | undefined
    if (toolName && customBlockRenderers[toolName]) {
      const result = customBlockRenderers[toolName](block)
      if (result !== null) return result
    }
  }

  // Check custom renderer by blockType
  if (customBlockRenderers && customBlockRenderers[block.blockType]) {
    const result = customBlockRenderers[block.blockType](block)
    if (result !== null) return result
  }

  const content = block.content as Record<string, unknown>

  // Local command group
  if (block.blockType === 'local_command_group') {
    return (
      <div className="cct-space-y-3">
        <div className="cct-text-sm cct-text-gray-500 cct-italic">Command executed</div>
        {block.childBlocks && block.childBlocks.length > 0 && (
          <div className="cct-space-y-2 cct-border-l-2 cct-border-gray-200 cct-pl-3">
            {block.childBlocks.map((child) => (
              <div key={child.id}>
                <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-gray-400">{child.label.text}</div>
                {child.blockType === 'local_command_output' ? (
                  <pre className="cct-max-h-[200px] cct-overflow-auto cct-whitespace-pre-wrap cct-rounded-lg cct-bg-gray-50 cct-p-2 cct-font-mono cct-text-xs cct-text-gray-600">
                    {typeof child.content === 'string' ? extractCommandOutput(child.content) : ''}
                  </pre>
                ) : child.blockType === 'compact_summary' ? (
                  <div className="cct-max-h-[300px] cct-overflow-auto cct-rounded-lg cct-bg-amber-50 cct-p-3 cct-text-xs cct-text-gray-700">
                    <pre className="cct-whitespace-pre-wrap cct-font-mono">
                      {typeof child.content === 'string' ? child.content : ''}
                    </pre>
                  </div>
                ) : (
                  <div className="cct-prose cct-prose-sm cct-max-w-none cct-text-gray-600">
                    {typeof child.content === 'string' ? child.content : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Tool group
  if (block.blockType === 'tool_group') {
    const toolName = content?.name as string | undefined
    const input = content?.input
    const resultBlock = block.toolResultBlock
    const resultContent = resultBlock?.content as Record<string, unknown> | undefined
    const resultData = resultContent?.content

    // Todo tool
    if (toolName && isTodoTool(toolName)) {
      const todos = extractTodos(toolName, input, resultData)
      if (todos) return <TodoListBlock todos={todos} />
    }

    // AskUserQuestion tool
    if (toolName && isAskUserQuestionTool(toolName)) {
      const questions = extractAskUserQuestions(input)
      if (questions) {
        const answers = parseUserAnswers(resultData)
        return <AskUserQuestionBlock questions={questions} answers={answers} />
      }
    }

    let displayResult: string
    if (typeof resultData === 'string') {
      displayResult = resultData
    } else if (Array.isArray(resultData)) {
      displayResult = resultData
        .map((c) => {
          if (typeof c === 'string') return c
          if (c?.type === 'text' && typeof c.text === 'string') return c.text
          return JSON.stringify(c, null, 2)
        })
        .join('\n')
    } else {
      displayResult = JSON.stringify(resultData, null, 2)
    }

    return (
      <div className="cct-space-y-3">
        <div>
          <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-gray-400">Input</div>
          <SyntaxHighlighter
            language="json"
            style={oneLight}
            customStyle={{ fontSize: '0.75rem', borderRadius: '0.5rem', margin: 0, maxHeight: '300px', overflow: 'auto' }}
          >
            {JSON.stringify(input, null, 2)}
          </SyntaxHighlighter>
        </div>
        {resultBlock && (
          <div>
            <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-gray-400">Result</div>
            <SyntaxHighlighter
              language="json"
              style={oneLight}
              customStyle={{ fontSize: '0.75rem', borderRadius: '0.5rem', margin: 0, maxHeight: '300px', overflow: 'auto' }}
            >
              {displayResult}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    )
  }

  // Skill group
  if (block.blockType === 'skill_group') {
    const input = content?.input as Record<string, unknown> | undefined
    const resultBlock = block.toolResultBlock
    const resultContent = resultBlock?.content as Record<string, unknown> | undefined
    const resultData = resultContent?.content as string | undefined
    const skillContentBlock = block.skillContentBlock
    const skillContent = skillContentBlock?.content

    let skillText = ''
    if (Array.isArray(skillContent)) {
      skillText = skillContent
        .map((c) => {
          if (typeof c === 'string') return c
          if (c?.type === 'text' && typeof c.text === 'string') return c.text
          return ''
        })
        .filter(Boolean)
        .join('\n')
    } else if (typeof skillContent === 'string') {
      skillText = skillContent
    }

    return (
      <div className="cct-space-y-3">
        {resultData && (
          <div className="cct-flex cct-items-center cct-gap-2 cct-text-sm">
            <Check className="cct-h-4 cct-w-4 cct-text-green-500" />
            <span className="cct-text-gray-600">{resultData}</span>
          </div>
        )}
        {skillText && (
          <div className="cct-border cct-border-gray-200 cct-rounded-lg cct-p-3 cct-bg-white">
            <div className="cct-mb-2 cct-text-xs cct-font-medium cct-text-gray-400">Skill Content</div>
            <MarkdownContent
              text={skillText}
              proseClass="cct-prose cct-prose-sm cct-max-w-none prose-headings:cct-mt-3 prose-headings:cct-mb-2 prose-p:cct-my-1 prose-ul:cct-my-1 prose-ol:cct-my-1 prose-li:cct-my-0.5 prose-pre:cct-my-2"
            />
          </div>
        )}
        {!skillText && (
          <div>
            <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-gray-400">Input</div>
            <SyntaxHighlighter
              language="json"
              style={oneLight}
              customStyle={{ fontSize: '0.75rem', borderRadius: '0.5rem', margin: 0, maxHeight: '200px', overflow: 'auto' }}
            >
              {JSON.stringify(input, null, 2)}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    )
  }

  // Local command input
  if (block.blockType === 'local_command') {
    return <div className="cct-text-sm cct-text-gray-500 cct-italic">Command executed</div>
  }

  // Local command output
  if (block.blockType === 'local_command_output') {
    const output = typeof block.content === 'string' ? extractCommandOutput(block.content) : ''
    if (!output) {
      return <div className="cct-text-sm cct-text-gray-400 cct-italic">(no output)</div>
    }
    return (
      <pre className="cct-max-h-[300px] cct-overflow-auto cct-whitespace-pre-wrap cct-rounded-lg cct-bg-gray-50 cct-p-3 cct-font-mono cct-text-xs cct-text-gray-600">
        {output}
      </pre>
    )
  }

  // Text content (user or assistant)
  if (block.blockType === 'text') {
    const text = typeof content === 'string' ? content : content?.text
    if (typeof text === 'string') {
      return (
        <MarkdownContent
          text={text}
          proseClass="cct-prose cct-prose-sm cct-max-w-none cct-text-gray-700 prose-headings:cct-text-gray-900 prose-code:cct-rounded prose-code:cct-bg-gray-100 prose-code:cct-px-1 prose-code:cct-py-0.5 prose-code:cct-text-gray-800 prose-code:before:cct-content-none prose-code:after:cct-content-none prose-pre:cct-bg-gray-100 prose-pre:cct-text-gray-800"
        />
      )
    }
  }

  // Thinking block
  if (block.blockType === 'thinking') {
    const thinking = content?.thinking as string
    return (
      <MarkdownContent
        text={thinking}
        proseClass="cct-prose cct-prose-sm cct-max-w-none cct-text-purple-900 prose-headings:cct-text-purple-900 prose-code:cct-rounded prose-code:cct-bg-purple-100 prose-code:cct-px-1 prose-code:cct-py-0.5 prose-code:cct-text-purple-800 prose-code:before:cct-content-none prose-code:after:cct-content-none prose-pre:cct-bg-purple-50 prose-pre:cct-text-purple-900"
      />
    )
  }

  // Tool use block
  if (block.blockType === 'tool_use') {
    const input = content?.input
    return (
      <SyntaxHighlighter
        language="json"
        style={oneLight}
        customStyle={{ fontSize: '0.75rem', borderRadius: '0.5rem', margin: 0, maxHeight: '400px', overflow: 'auto' }}
      >
        {JSON.stringify(input, null, 2)}
      </SyntaxHighlighter>
    )
  }

  // Tool result in user message
  if (block.blockType === 'tool_result') {
    const resultContent = content?.content
    let displayContent: string
    if (typeof resultContent === 'string') {
      displayContent = resultContent
    } else if (Array.isArray(resultContent)) {
      displayContent = resultContent
        .map((c) => {
          if (typeof c === 'string') return c
          if (c?.type === 'text' && typeof c.text === 'string') return c.text
          return JSON.stringify(c, null, 2)
        })
        .join('\n')
    } else {
      displayContent = JSON.stringify(resultContent, null, 2)
    }
    return (
      <SyntaxHighlighter
        language="json"
        style={oneLight}
        customStyle={{ fontSize: '0.75rem', borderRadius: '0.5rem', margin: 0, maxHeight: '400px', overflow: 'auto' }}
      >
        {displayContent}
      </SyntaxHighlighter>
    )
  }

  // Standalone tool_use/tool_result events
  if (block.eventType === 'tool_use' || block.eventType === 'tool_result') {
    const payload = block.content as Record<string, unknown>
    const input = payload?.input || payload?.result || payload
    return (
      <SyntaxHighlighter
        language="json"
        style={oneLight}
        customStyle={{ fontSize: '0.75rem', borderRadius: '0.5rem', margin: 0, maxHeight: '400px', overflow: 'auto' }}
      >
        {JSON.stringify(input, null, 2)}
      </SyntaxHighlighter>
    )
  }

  // Fallback: show as JSON
  return (
    <pre className="cct-max-h-[300px] cct-overflow-auto cct-whitespace-pre-wrap cct-text-xs cct-text-gray-600">
      {JSON.stringify(content, null, 2)}
    </pre>
  )
}

// --- Main component ---

export function ContentBlockCard({ block, customBlockRenderers }: ContentBlockCardProps) {
  const isSecondary = isSecondaryBlock(block)
  const [expanded, setExpanded] = useState(() => shouldExpandByDefault(block))
  const styles = getBlockContainerStyle(block)

  // Primary blocks (User/Assistant) don't have collapse functionality
  if (!isSecondary) {
    return (
      <div className={styles.wrapper}>
        <div className={cn('cct-group cct-overflow-hidden cct-rounded-xl', styles.container)}>
          <div className={cn('cct-flex cct-items-center cct-justify-between', styles.header)}>
            <div className="cct-flex cct-items-center cct-gap-2">
              <span className={cn('cct-flex cct-h-6 cct-w-6 cct-items-center cct-justify-center cct-rounded-full', getIconStyle(block))}>
                {getIcon(block)}
              </span>
              <span className="cct-font-medium cct-text-gray-900">{block.label.text}</span>
            </div>
            <div className="cct-flex cct-items-center cct-gap-2 cct-text-sm cct-text-gray-500">
              <span>{format(new Date(block.timestamp), 'HH:mm:ss')}</span>
              <PermalinkButton blockId={block.id} />
            </div>
          </div>
          <div className="cct-border-t cct-border-gray-100 cct-px-4 cct-py-3">
            {renderContent(block, customBlockRenderers)}
          </div>
        </div>
      </div>
    )
  }

  // Secondary blocks have collapse functionality
  return (
    <div className={styles.wrapper}>
      <div className={cn('cct-group cct-overflow-hidden cct-rounded-xl', styles.container)}>
        <div className={cn('cct-flex cct-w-full cct-items-center cct-justify-between', styles.header)}>
          <button
            className="cct-flex cct-flex-1 cct-items-center cct-gap-2 cct-text-left cct-transition-colors hover:cct-bg-gray-50/50"
            onClick={() => setExpanded(!expanded)}
          >
            <span className={cn('cct-flex cct-h-5 cct-w-5 cct-items-center cct-justify-center cct-rounded-full', getIconStyle(block))}>
              {getIcon(block)}
            </span>
            <span className="cct-text-sm cct-font-medium cct-text-gray-600">{block.label.text}</span>
            {block.label.params && (
              <code className="cct-rounded cct-bg-gray-100 cct-px-1 cct-py-0.5 cct-text-xs cct-font-normal cct-text-gray-700">
                {block.label.params}
              </code>
            )}
          </button>
          <div className="cct-flex cct-items-center cct-gap-2 cct-text-xs cct-text-gray-500">
            <span>{format(new Date(block.timestamp), 'HH:mm:ss')}</span>
            <PermalinkButton blockId={block.id} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="cct-p-0.5 hover:cct-bg-gray-100 cct-rounded"
            >
              {expanded ? (
                <ChevronDown className="cct-h-3 cct-w-3" />
              ) : (
                <ChevronRight className="cct-h-3 cct-w-3" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="cct-border-t cct-border-gray-100 cct-px-3 cct-py-2">
            {renderContent(block, customBlockRenderers)}
          </div>
        )}
      </div>
    </div>
  )
}
