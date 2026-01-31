import { Circle, CircleDot, MessageCircleQuestion, Pencil } from 'lucide-react'
import { cn } from '../../cn'
import { extractTextFromContentBlock } from '../../../core/content-utils'

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

export function extractAskUserQuestions(input: unknown): AskUserQuestionItem[] | null {
  const inputObj = input as { questions?: AskUserQuestionItem[] } | undefined
  if (inputObj?.questions && Array.isArray(inputObj.questions)) return inputObj.questions
  return null
}

export function parseUserAnswers(resultContent: unknown): Record<string, string> {
  const answers: Record<string, string> = {}
  let contentStr: string
  if (typeof resultContent === 'string') {
    contentStr = resultContent
  } else if (Array.isArray(resultContent)) {
    contentStr = resultContent
      .map((c) => extractTextFromContentBlock(c))
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

export function AskUserQuestionBlock({
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
