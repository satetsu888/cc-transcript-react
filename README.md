# cc-transcript-react

React component library for displaying [Claude Code](https://claude.ai/code) transcripts.

[Live Demo (Storybook)](https://satetsu888.github.io/cc-transcript-react/)

**See how it renders your own sessions — no setup needed:**

```bash
npx cc-transcript-react
```

Opens `http://localhost:3333` with all your Claude Code sessions. Click one to view its full transcript.

```bash
# View a specific session
npx cc-transcript-react <session-id>

# Custom port / dark theme
npx cc-transcript-react -p 8080 --dark
```

## Installation

```bash
npm install cc-transcript-react
```

## Usage

```tsx
import { ClaudeCodeTranscript } from 'cc-transcript-react'
import 'cc-transcript-react/styles.css'

function App({ events }) {
  return (
    <ClaudeCodeTranscript
      events={events}
      colorScheme="light"
      projectPath="/path/to/project"
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `events` | `TranscriptEvent[]` | (required) | Array of raw transcript events |
| `projectPath` | `string` | — | Project path for relative file path display |
| `colorScheme` | `'light' \| 'dark'` | `'light'` | Color scheme |
| `className` | `string` | — | CSS class for the root container |
| `classNames` | `TranscriptClassNames` | — | Slot-based class name overrides |
| `theme` | `TranscriptTheme` | — | Code highlight theme overrides |
| `customBlockRenderers` | `Record<string, (block: DisplayBlock) => ReactNode \| null>` | — | Custom renderers by block type or tool name |
| `generatePermalink` | `(blockId: string) => string` | — | Custom permalink generator |
| `copyToClipboard` | `(text: string) => Promise<void>` | — | Custom clipboard handler |

### Custom Block Renderers

Override rendering for specific tools:

```tsx
<ClaudeCodeTranscript
  events={events}
  customBlockRenderers={{
    'mcp__myserver__my_tool': (block) => <MyToolCard block={block} />,
  }}
/>
```

### Parsing Session Logs

Convert Claude Code's JSONL session files to `TranscriptEvent[]`:

```ts
import { parseSessionLog } from 'cc-transcript-react/headless'
import fs from 'fs'

const jsonl = fs.readFileSync('~/.claude/projects/.../session.jsonl', 'utf-8')
const events = parseSessionLog(jsonl)
```

## Headless API

For non-React environments (Node.js scripts, React Native, custom renderers):

```ts
import {
  parseSessionLog,
  filterHiddenEvents,
  expandEvents,
  extractMessageBlocks,
} from 'cc-transcript-react/headless'
```

No React or DOM dependency.

## License

MIT
