import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { useTranscriptContext } from '../context'
import { cn } from '../cn'

export function CodeBlock({
  children,
  language = 'json',
  maxHeight = '300px',
  className,
}: {
  children: string
  language?: string
  maxHeight?: string
  className?: string
}) {
  const { codeTheme, codeCustomStyle } = useTranscriptContext()

  return (
    <SyntaxHighlighter
      language={language}
      style={codeTheme}
      customStyle={{
        fontSize: '0.75rem',
        borderRadius: '0.5rem',
        margin: 0,
        maxHeight,
        overflow: 'auto',
        ...codeCustomStyle,
      }}
      className={cn(className)}
    >
      {children}
    </SyntaxHighlighter>
  )
}
