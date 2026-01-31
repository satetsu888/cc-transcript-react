import type { DisplayBlock } from '../../../core/types'
import { joinContentText } from '../../../core/content-utils'
import { isTodoTool, isAskUserQuestionTool } from '../block-classification'
import { CodeBlock } from '../CodeBlock'
import { extractTodos, TodoListBlock } from './TodoRenderer'
import { extractAskUserQuestions, parseUserAnswers, AskUserQuestionBlock } from './AskUserQuestionRenderer'

export function ToolGroupRenderer({ block }: { block: DisplayBlock }) {
  const content = block.content as Record<string, unknown>
  const toolName = content?.name as string | undefined
  const input = content?.input
  const resultBlock = block.toolResultBlock
  const resultContent = resultBlock?.content as Record<string, unknown> | undefined
  const resultData = resultContent?.content

  if (toolName && isTodoTool(toolName)) {
    const todos = extractTodos(toolName, input, resultData)
    if (todos) return <TodoListBlock todos={todos} />
  }

  if (toolName && isAskUserQuestionTool(toolName)) {
    const questions = extractAskUserQuestions(input)
    if (questions) {
      const answers = parseUserAnswers(resultData)
      return <AskUserQuestionBlock questions={questions} answers={answers} />
    }
  }

  const displayResult = joinContentText(resultData, {
    fallback: (c) => JSON.stringify(c, null, 2),
  }) || JSON.stringify(resultData, null, 2)

  return (
    <div className="cct-space-y-3">
      <div>
        <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">Input</div>
        <CodeBlock>{JSON.stringify(input, null, 2)}</CodeBlock>
      </div>
      {resultBlock && (
        <div>
          <div className="cct-mb-1 cct-text-xs cct-font-medium cct-text-[var(--cct-text-muted)]">Result</div>
          <CodeBlock>{displayResult}</CodeBlock>
        </div>
      )}
    </div>
  )
}
