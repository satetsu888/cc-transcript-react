import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { useTranscriptContext } from '../context'

export function MarkdownContent({
  text,
  proseClass,
}: {
  text: string
  proseClass: string
}) {
  const { codeTheme, codeCustomStyle } = useTranscriptContext()

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
