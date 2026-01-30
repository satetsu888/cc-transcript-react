import { cn } from '../cn'
import {
  User, Bot, Wrench, Sparkles, ChevronDown, ChevronRight,
  Terminal, Check, Circle, CheckCircle2, CircleDot,
  MessageCircleQuestion, Pencil, Link2,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DisplayBlock, ColorScheme, TranscriptClassNames, TranscriptTheme } from '../types'

export interface ContentBlockCardProps {
  block: DisplayBlock
  colorScheme?: ColorScheme
  classNames?: TranscriptClassNames
  theme?: TranscriptTheme
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
    return 'cct-bg-[var(--cct-secondary-icon-bg)] cct-text-[var(--cct-text-tertiary)]'
  }
  if (block.eventType === 'user') {
    return 'cct-bg-[var(--cct-user-icon-bg)] cct-text-[var(--cct-user-icon-text)]'
  }
  return 'cct-bg-[var(--cct-assistant-icon-bg)] cct-text-[var(--cct-assistant-icon-text)]'
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
    return <div className="cct-text-sm cct-text-[var(--cct-text-tertiary)] cct-italic">No tasks</div>
  }
  return (
    <div className="cct-space-y-1.5">
      {todos.map((todo, i) => (
        <div key={i} className="cct-flex cct-items-start cct-gap-2">
          {todo.status === 'completed' && (
            <CheckCircle2 className="cct-h-4 cct-w-4 cct-text-[var(--cct-todo-completed)] cct-flex-shrink-0 cct-mt-0.5" />
          )}
          {todo.status === 'in_progress' && (
            <CircleDot className="cct-h-4 cct-w-4 cct-text-[var(--cct-todo-in-progress)] cct-flex-shrink-0 cct-mt-0.5" />
          )}
          {todo.status === 'pending' && (
            <Circle className="cct-h-4 cct-w-4 cct-text-[var(--cct-todo-pending)] cct-flex-shrink-0 cct-mt-0.5" />
          )}
          <span
            className={cn(
              'cct-text-sm',
              todo.status === 'completed' && 'cct-text-[var(--cct-text-tertiary)] cct-line-through',
              todo.status === 'in_progress' && 'cct-text-[var(--cct-selected-text)] cct-font-medium',
              todo.status === 'pending' && 'cct-text-[var(--cct-text-body)]'
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
    return <div className="cct-text-sm cct-text-[var(--cct-text-tertiary)] cct-italic">No questions</div>
  }
  return (
    <div className="cct-space-y-4">
      {questions.map((q, i) => {
        const answer = answers[q.question]
        const isOtherAnswer = answer && !isOptionSelected(answer, q.options)
        return (
          <div key={i} className="cct-rounded-[var(--cct-border-radius-sm)] cct-border cct-border-[var(--cct-border-default)] cct-bg-[var(--cct-bg-primary)] cct-p-3">
            <div className="cct-mb-1 cct-flex cct-items-center cct-gap-1.5 cct-text-xs cct-font-medium cct-text-[var(--cct-text-tertiary)]">
              <MessageCircleQuestion className="cct-h-3.5 cct-w-3.5" />
              {q.header}
            </div>
            <div className="cct-mb-3 cct-font-medium cct-text-[var(--cct-text-primary)]">{q.question}</div>
            <div className="cct-space-y-2">
              {q.options.map((opt, j) => {
                const isSelected = answer === opt.label
                return (
                  <div
                    key={j}
                    className={cn(
                      'cct-flex cct-items-start cct-gap-2 cct-rounded-md cct-p-2 cct-transition-colors',
                      isSelected && 'cct-bg-[var(--cct-selected-bg)]'
                    )}
                  >
                    {isSelected ? (
                      <CircleDot className="cct-mt-0.5 cct-h-4 cct-w-4 cct-flex-shrink-0 cct-text-[var(--cct-selected-icon)]" />
                    ) : (
                      <Circle className="cct-mt-0.5 cct-h-4 cct-w-4 cct-flex-shrink-0 cct-text-[var(--cct-text-disabled)]" />
                    )}
                    <div className="cct-min-w-0 cct-flex-1">
                      <span className={cn('cct-text-sm', isSelected ? 'cct-font-medium cct-text-[var(--cct-selected-text)]' : 'cct-text-[var(--cct-text-body)]')}>
                        {opt.label}
                      </span>
                      {opt.description && (
                        <p className="cct-mt-0.5 cct-text-xs cct-text-[var(--cct-text-tertiary)]">{opt.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {isOtherAnswer && (
                <div className="cct-mt-2 cct-flex cct-items-start cct-gap-2 cct-rounded-md cct-border-t cct-border-[var(--cct-border-subtle)] cct-bg-[var(--cct-selected-bg)] cct-p-2 cct-pt-3">
                  <Pencil className="cct-mt-0.5 cct-h-4 cct-w-4 cct-flex-shrink-0 cct-text-[var(--cct-selected-icon)]" />
                  <div className="cct-min-w-0 cct-flex-1">
                    <span className="cct-text-xs cct-font-medium cct-text-[var(--cct-text-tertiary)]">Other</span>
                    <p className="cct-text-sm cct-font-medium cct-text-[var(--cct-selected-text)]">{answer}</p>
                  </div>
                </div>
              )}
              {!answer && (
                <div className="cct-mt-2 cct-text-xs cct-italic cct-text-[var(--cct-text-muted)]">Waiting for answer...</div>
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

// --- Markdown renderer helper ---

function MarkdownContent({
  text,
  proseClass,
  codeTheme,
  codeCustomStyle,
}: {
  text: string
  proseClass: string
  codeTheme: Record<string, React.CSSProperties>
  codeCustomStyle?: React.CSSProperties
}) {
  const defaultCodeStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    borderRadius: '0.5rem',
    margin: 0,
    ...codeCustomStyle,
  }

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
                  style={codeTheme}
                  customStyle={defaultCodeStyle}
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
  resolvedCodeTheme: Record<string, React.CSSProperties>,
  codeCustomStyle: React.CSSProperties | undefined,
  classNames: TranscriptClassNames | undefined,
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

  const syntaxHighlighterStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    borderRadius: '0.5rem',
    margin: 0,
    maxHeight: '300px',
    overflow: 'auto',
    ...codeCustomStyle,
  }

  const syntaxHighlighterStyleTall: React.CSSProperties = {
    ...syntaxHighlighterStyle,
    maxHeight: '400px',
  }

  // Local command group
  if (block.blockType === 'local_command_group') {
    return (
      <div className="cct-space-y-3">
        <div className="cct-text-sm cct-text-[var(--cct-text-tertiary)] cct-italic">Command executed</div>
        {block.childBlocks && block.childBlocks.length > 0 && (
          <div className="cct-space-y-2 cct-border-l-2 cct-border-[var(--cct-border-default)] cct-pl-3">
            {block.childBlocks.map((child) => (
              <div key={child.id}>
                <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">{child.label.text}</div>
                {child.blockType === 'local_command_output' ? (
                  <pre className="cct-max-h-[200px] cct-overflow-auto cct-whitespace-pre-wrap cct-rounded-[var(--cct-border-radius-sm)] cct-bg-[var(--cct-bg-secondary)] cct-p-2 cct-font-mono cct-text-xs cct-text-[var(--cct-text-secondary)]">
                    {typeof child.content === 'string' ? extractCommandOutput(child.content) : ''}
                  </pre>
                ) : child.blockType === 'compact_summary' ? (
                  <div className="cct-max-h-[300px] cct-overflow-auto cct-rounded-[var(--cct-border-radius-sm)] cct-bg-[var(--cct-summary-bg)] cct-p-3 cct-text-xs cct-text-[var(--cct-text-body)]">
                    <pre className="cct-whitespace-pre-wrap cct-font-mono">
                      {typeof child.content === 'string' ? child.content : ''}
                    </pre>
                  </div>
                ) : (
                  <div className={cn('cct-prose cct-prose-sm cct-max-w-none cct-text-[var(--cct-text-secondary)]', classNames?.markdown)}>
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
          <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">Input</div>
          <SyntaxHighlighter
            language="json"
            style={resolvedCodeTheme}
            customStyle={syntaxHighlighterStyle}
          >
            {JSON.stringify(input, null, 2)}
          </SyntaxHighlighter>
        </div>
        {resultBlock && (
          <div>
            <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">Result</div>
            <SyntaxHighlighter
              language="json"
              style={resolvedCodeTheme}
              customStyle={syntaxHighlighterStyle}
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
            <Check className="cct-h-4 cct-w-4 cct-text-[var(--cct-success)]" />
            <span className="cct-text-[var(--cct-text-secondary)]">{resultData}</span>
          </div>
        )}
        {skillText && (
          <div className="cct-border cct-border-[var(--cct-border-default)] cct-rounded-[var(--cct-border-radius-sm)] cct-p-3 cct-bg-[var(--cct-bg-primary)]">
            <div className="cct-mb-2 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">Skill Content</div>
            <MarkdownContent
              text={skillText}
              proseClass={cn(
                'cct-prose cct-prose-sm cct-max-w-none prose-headings:cct-mt-3 prose-headings:cct-mb-2 prose-p:cct-my-1 prose-ul:cct-my-1 prose-ol:cct-my-1 prose-li:cct-my-0.5 prose-pre:cct-my-2',
                classNames?.markdown,
              )}
              codeTheme={resolvedCodeTheme}
              codeCustomStyle={codeCustomStyle}
            />
          </div>
        )}
        {!skillText && (
          <div>
            <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">Input</div>
            <SyntaxHighlighter
              language="json"
              style={resolvedCodeTheme}
              customStyle={{ ...syntaxHighlighterStyle, maxHeight: '200px' }}
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
    return <div className="cct-text-sm cct-text-[var(--cct-text-tertiary)] cct-italic">Command executed</div>
  }

  // Local command output
  if (block.blockType === 'local_command_output') {
    const output = typeof block.content === 'string' ? extractCommandOutput(block.content) : ''
    if (!output) {
      return <div className="cct-text-sm cct-text-[var(--cct-text-muted)] cct-italic">(no output)</div>
    }
    return (
      <pre className="cct-max-h-[300px] cct-overflow-auto cct-whitespace-pre-wrap cct-rounded-[var(--cct-border-radius-sm)] cct-bg-[var(--cct-bg-secondary)] cct-p-3 cct-font-mono cct-text-xs cct-text-[var(--cct-text-secondary)]">
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
          proseClass={cn(
            'cct-prose cct-prose-sm cct-max-w-none cct-text-[var(--cct-text-body)] prose-headings:cct-text-[var(--cct-text-primary)] prose-code:cct-rounded prose-code:cct-bg-[var(--cct-bg-code)] prose-code:cct-px-1 prose-code:cct-py-0.5 prose-code:cct-text-[var(--cct-text-primary)] prose-code:before:cct-content-none prose-code:after:cct-content-none prose-pre:cct-bg-[var(--cct-bg-code)] prose-pre:cct-text-[var(--cct-text-primary)]',
            classNames?.markdown,
          )}
          codeTheme={resolvedCodeTheme}
          codeCustomStyle={codeCustomStyle}
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
        proseClass={cn(
          'cct-prose cct-prose-sm cct-max-w-none cct-text-[var(--cct-thinking-text)] prose-headings:cct-text-[var(--cct-thinking-text)] prose-code:cct-rounded prose-code:cct-bg-[var(--cct-thinking-code-bg)] prose-code:cct-px-1 prose-code:cct-py-0.5 prose-code:cct-text-[var(--cct-thinking-code-text)] prose-code:before:cct-content-none prose-code:after:cct-content-none prose-pre:cct-bg-[var(--cct-thinking-pre-bg)] prose-pre:cct-text-[var(--cct-thinking-text)]',
          classNames?.markdown,
        )}
        codeTheme={resolvedCodeTheme}
        codeCustomStyle={codeCustomStyle}
      />
    )
  }

  // Tool use block
  if (block.blockType === 'tool_use') {
    const input = content?.input
    return (
      <SyntaxHighlighter
        language="json"
        style={resolvedCodeTheme}
        customStyle={syntaxHighlighterStyleTall}
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
        style={resolvedCodeTheme}
        customStyle={syntaxHighlighterStyleTall}
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
        style={resolvedCodeTheme}
        customStyle={syntaxHighlighterStyleTall}
      >
        {JSON.stringify(input, null, 2)}
      </SyntaxHighlighter>
    )
  }

  // Fallback: show as JSON
  return (
    <pre className="cct-max-h-[300px] cct-overflow-auto cct-whitespace-pre-wrap cct-text-xs cct-text-[var(--cct-text-secondary)]">
      {JSON.stringify(content, null, 2)}
    </pre>
  )
}

// --- Main component ---

export function ContentBlockCard({ block, colorScheme, classNames, theme, customBlockRenderers }: ContentBlockCardProps) {
  const isSecondary = isSecondaryBlock(block)
  const [expanded, setExpanded] = useState(() => shouldExpandByDefault(block))
  const styles = getBlockContainerStyle(block)

  const resolvedCodeTheme = useMemo(() => {
    if (theme?.codeTheme) return theme.codeTheme
    return colorScheme === 'dark' ? oneDark : oneLight
  }, [theme?.codeTheme, colorScheme])

  const codeCustomStyle = theme?.codeCustomStyle

  // Primary blocks (User/Assistant) don't have collapse functionality
  if (!isSecondary) {
    return (
      <div className={cn(styles.wrapper, classNames?.blockWrapper)}>
        <div className={cn('cct-group cct-overflow-hidden cct-rounded-[var(--cct-border-radius)]', styles.container, classNames?.primaryBlock)}>
          <div className={cn('cct-flex cct-items-center cct-justify-between', styles.header, classNames?.primaryHeader)}>
            <div className="cct-flex cct-items-center cct-gap-2">
              <span className={cn('cct-flex cct-h-6 cct-w-6 cct-items-center cct-justify-center cct-rounded-full', getIconStyle(block), classNames?.icon)}>
                {getIcon(block)}
              </span>
              <span className={cn('cct-font-medium cct-text-[var(--cct-text-primary)]', classNames?.label)}>{block.label.text}</span>
            </div>
            <div className={cn('cct-flex cct-items-center cct-gap-2 cct-text-sm cct-text-[var(--cct-text-tertiary)]', classNames?.timestamp)}>
              <span>{format(new Date(block.timestamp), 'HH:mm:ss')}</span>
              <PermalinkButton blockId={block.id} />
            </div>
          </div>
          <div className={cn('cct-border-t cct-border-[var(--cct-border-subtle)] cct-px-4 cct-py-3', classNames?.primaryContent)}>
            {renderContent(block, resolvedCodeTheme, codeCustomStyle, classNames, customBlockRenderers)}
          </div>
        </div>
      </div>
    )
  }

  // Secondary blocks have collapse functionality
  return (
    <div className={cn(styles.wrapper, classNames?.blockWrapper)}>
      <div className={cn('cct-group cct-overflow-hidden cct-rounded-[var(--cct-border-radius)]', styles.container, classNames?.secondaryBlock)}>
        <div className={cn('cct-flex cct-w-full cct-items-center cct-justify-between', styles.header, classNames?.secondaryHeader)}>
          <button
            className="cct-flex cct-flex-1 cct-items-center cct-gap-2 cct-text-left cct-transition-colors hover:cct-bg-[var(--cct-bg-secondary)]"
            onClick={() => setExpanded(!expanded)}
          >
            <span className={cn('cct-flex cct-h-5 cct-w-5 cct-items-center cct-justify-center cct-rounded-full', getIconStyle(block), classNames?.icon)}>
              {getIcon(block)}
            </span>
            <span className={cn('cct-text-sm cct-font-medium cct-text-[var(--cct-text-secondary)]', classNames?.label)}>{block.label.text}</span>
            {block.label.params && (
              <code className="cct-rounded cct-bg-[var(--cct-bg-code)] cct-px-1 cct-py-0.5 cct-text-xs cct-font-normal cct-text-[var(--cct-text-body)]">
                {block.label.params}
              </code>
            )}
          </button>
          <div className={cn('cct-flex cct-items-center cct-gap-2 cct-text-xs cct-text-[var(--cct-text-tertiary)]', classNames?.timestamp)}>
            <span>{format(new Date(block.timestamp), 'HH:mm:ss')}</span>
            <PermalinkButton blockId={block.id} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="cct-p-0.5 hover:cct-bg-[var(--cct-bg-code)] cct-rounded"
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
          <div className={cn('cct-border-t cct-border-[var(--cct-border-subtle)] cct-px-3 cct-py-2', classNames?.secondaryContent)}>
            {renderContent(block, resolvedCodeTheme, codeCustomStyle, classNames, customBlockRenderers)}
          </div>
        )}
      </div>
    </div>
  )
}
