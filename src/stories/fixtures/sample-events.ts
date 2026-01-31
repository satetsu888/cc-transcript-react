import type { TranscriptEvent } from '../../core/types'

// --- Helpers ---

let counter = 0
function uuid(): string {
  return `uuid-${++counter}`
}

function ts(minuteOffset: number, secondOffset = 0): string {
  const d = new Date('2025-06-15T14:00:00Z')
  d.setMinutes(d.getMinutes() + minuteOffset)
  d.setSeconds(d.getSeconds() + secondOffset)
  return d.toISOString()
}

function userEvent(content: unknown, time: string, extra?: Record<string, unknown>): TranscriptEvent {
  return {
    uuid: uuid(),
    event_type: 'user',
    payload: { message: { content }, timestamp: time, ...extra },
    created_at: time,
  }
}

function assistantEvent(content: unknown, time: string): TranscriptEvent {
  return {
    uuid: uuid(),
    event_type: 'assistant',
    payload: { message: { content }, timestamp: time },
    created_at: time,
  }
}

// --- Basic conversation (TextRenderer) ---

export const basicConversation: TranscriptEvent[] = [
  userEvent('How do I create a React component with TypeScript?', ts(0)),
  assistantEvent([
    {
      type: 'text',
      text: "Here's how to create a React component with TypeScript:\n\n```tsx\nimport { useState } from 'react'\n\ninterface Props {\n  name: string\n  count?: number\n}\n\nexport function Greeting({ name, count = 0 }: Props) {\n  const [clicks, setClicks] = useState(count)\n\n  return (\n    <div>\n      <h1>Hello, {name}!</h1>\n      <button onClick={() => setClicks(c => c + 1)}>\n        Clicked {clicks} times\n      </button>\n    </div>\n  )\n}\n```\n\nKey points:\n- Define a `Props` interface for type-safe props\n- Use `useState` with proper type inference\n- Export as a named function component",
    },
  ], ts(0, 15)),
  userEvent('Can you also show me how to use useEffect?', ts(1)),
  assistantEvent([
    {
      type: 'text',
      text: "Here's an example using `useEffect`:\n\n```tsx\nimport { useState, useEffect } from 'react'\n\nexport function Timer() {\n  const [seconds, setSeconds] = useState(0)\n\n  useEffect(() => {\n    const interval = setInterval(() => {\n      setSeconds(s => s + 1)\n    }, 1000)\n\n    return () => clearInterval(interval)\n  }, [])\n\n  return <div>Elapsed: {seconds}s</div>\n}\n```\n\nThe cleanup function (`return () => clearInterval(interval)`) runs when the component unmounts.",
    },
  ], ts(1, 10)),
]

// --- Thinking events (ThinkingRenderer) ---

export const thinkingEvents: TranscriptEvent[] = [
  userEvent('What is the best approach to implement authentication in a Next.js app?', ts(0)),
  assistantEvent([
    {
      type: 'thinking',
      thinking: "The user is asking about authentication in Next.js. Let me consider the main approaches:\n\n1. NextAuth.js (now Auth.js) - Most popular, supports many providers\n2. Clerk - Hosted auth, easy setup, good DX\n3. Supabase Auth - Good if already using Supabase\n4. Custom JWT - More control but more work\n\nI should recommend NextAuth.js as it's the most widely used and well-documented approach. I'll also mention middleware for route protection.",
    },
    {
      type: 'text',
      text: "For Next.js authentication, I recommend **NextAuth.js** (Auth.js). Here's why:\n\n1. **Built for Next.js** — Seamless integration with App Router and Server Components\n2. **Multiple providers** — Google, GitHub, email/password, and 50+ others\n3. **Session management** — Handles JWT and database sessions\n4. **Middleware support** — Protect routes at the edge\n\nBasic setup:\n\n```ts\n// app/api/auth/[...nextauth]/route.ts\nimport NextAuth from 'next-auth'\nimport GitHub from 'next-auth/providers/github'\n\nconst handler = NextAuth({\n  providers: [\n    GitHub({\n      clientId: process.env.GITHUB_ID!,\n      clientSecret: process.env.GITHUB_SECRET!,\n    }),\n  ],\n})\n\nexport { handler as GET, handler as POST }\n```",
    },
  ], ts(0, 20)),
]

// --- Tool group events (ToolGroupRenderer) ---

const readToolUseId = uuid()
const editToolUseId = uuid()
const bashToolUseId = uuid()
const grepToolUseId = uuid()

export const toolGroupEvents: TranscriptEvent[] = [
  userEvent('Read the config file and fix the typo in the database host', ts(0)),
  // Assistant uses Read tool
  assistantEvent([
    {
      type: 'text',
      text: "Let me read the config file first.",
    },
    {
      type: 'tool_use',
      id: readToolUseId,
      name: 'Read',
      input: { file_path: '/home/user/project/src/config/database.ts' },
    },
  ], ts(0, 5)),
  // Read result
  userEvent([
    {
      type: 'tool_result',
      tool_use_id: readToolUseId,
      content: "     1\texport const dbConfig = {\n     2\t  host: 'localhsot',\n     3\t  port: 5432,\n     4\t  database: 'myapp',\n     5\t  user: 'admin',\n     6\t  password: process.env.DB_PASSWORD,\n     7\t}\n",
    },
  ], ts(0, 6)),
  // Assistant uses Edit tool
  assistantEvent([
    {
      type: 'text',
      text: "I found the typo — `localhsot` should be `localhost`. Let me fix it.",
    },
    {
      type: 'tool_use',
      id: editToolUseId,
      name: 'Edit',
      input: {
        file_path: '/home/user/project/src/config/database.ts',
        old_string: "  host: 'localhsot',",
        new_string: "  host: 'localhost',",
      },
    },
  ], ts(0, 8)),
  // Edit result
  userEvent([
    {
      type: 'tool_result',
      tool_use_id: editToolUseId,
      content: 'The file /home/user/project/src/config/database.ts has been updated successfully.',
    },
  ], ts(0, 9)),
  // Bash tool
  assistantEvent([
    {
      type: 'text',
      text: "Let me verify the fix by checking the file.",
    },
    {
      type: 'tool_use',
      id: bashToolUseId,
      name: 'Bash',
      input: { command: 'npm run typecheck -- --noEmit 2>&1 | head -20' },
    },
  ], ts(0, 12)),
  userEvent([
    {
      type: 'tool_result',
      tool_use_id: bashToolUseId,
      content: 'No errors found.',
    },
  ], ts(0, 15)),
  // Grep tool
  assistantEvent([
    {
      type: 'tool_use',
      id: grepToolUseId,
      name: 'Grep',
      input: { pattern: 'localhsot', path: '/home/user/project/src' },
    },
  ], ts(0, 18)),
  userEvent([
    {
      type: 'tool_result',
      tool_use_id: grepToolUseId,
      content: 'No matches found.',
    },
  ], ts(0, 19)),
  assistantEvent([
    {
      type: 'text',
      text: "The typo has been fixed. The database host is now correctly set to `localhost`. No other occurrences of the typo were found in the project.",
    },
  ], ts(0, 22)),
]

// --- Todo events (TodoRenderer) ---

const todoWriteId = uuid()
const todoReadId = uuid()

export const todoEvents: TranscriptEvent[] = [
  userEvent('Create a task list for the authentication feature', ts(0)),
  assistantEvent([
    {
      type: 'tool_use',
      id: todoWriteId,
      name: 'TodoWrite',
      input: {
        todos: [
          { content: 'Set up NextAuth.js with GitHub provider', status: 'completed' },
          { content: 'Create login page UI', status: 'completed' },
          { content: 'Implement session middleware for protected routes', status: 'in_progress' },
          { content: 'Add role-based access control', status: 'pending' },
          { content: 'Write integration tests for auth flow', status: 'pending' },
          { content: 'Set up rate limiting on auth endpoints', status: 'pending' },
        ],
      },
    },
  ], ts(0, 5)),
  userEvent([
    {
      type: 'tool_result',
      tool_use_id: todoWriteId,
      content: 'Todos updated successfully.',
    },
  ], ts(0, 6)),
  assistantEvent([
    {
      type: 'text',
      text: "I've created a task list for the authentication feature. Two tasks are done, one is in progress, and three are pending.",
    },
    {
      type: 'tool_use',
      id: todoReadId,
      name: 'TodoRead',
      input: {},
    },
  ], ts(0, 10)),
  userEvent([
    {
      type: 'tool_result',
      tool_use_id: todoReadId,
      content: JSON.stringify({
        todos: [
          { content: 'Set up NextAuth.js with GitHub provider', status: 'completed' },
          { content: 'Create login page UI', status: 'completed' },
          { content: 'Implement session middleware for protected routes', status: 'in_progress' },
          { content: 'Add role-based access control', status: 'pending' },
          { content: 'Write integration tests for auth flow', status: 'pending' },
          { content: 'Set up rate limiting on auth endpoints', status: 'pending' },
        ],
      }),
    },
  ], ts(0, 11)),
]

// --- AskUserQuestion events (AskUserQuestionRenderer) ---

const askQuestionId = uuid()

export const askUserQuestionEvents: TranscriptEvent[] = [
  userEvent('Help me set up a database for the project', ts(0)),
  assistantEvent([
    {
      type: 'text',
      text: "I'd like to understand your preferences before setting up the database.",
    },
    {
      type: 'tool_use',
      id: askQuestionId,
      name: 'AskUserQuestion',
      input: {
        questions: [
          {
            header: 'Database',
            question: 'Which database would you like to use?',
            multiSelect: false,
            options: [
              { label: 'PostgreSQL', description: 'Robust relational database with excellent JSON support' },
              { label: 'SQLite', description: 'Lightweight, file-based database ideal for development' },
              { label: 'MySQL', description: 'Popular relational database with wide hosting support' },
              { label: 'MongoDB', description: 'Document-oriented NoSQL database for flexible schemas' },
            ],
          },
        ],
      },
    },
  ], ts(0, 5)),
  userEvent([
    {
      type: 'tool_result',
      tool_use_id: askQuestionId,
      content: '"Which database would you like to use?"="PostgreSQL"',
    },
  ], ts(0, 30)),
  assistantEvent([
    {
      type: 'text',
      text: "Great choice! PostgreSQL is excellent for production applications. Let me set it up with Prisma as the ORM.",
    },
  ], ts(0, 35)),
]

// --- Skill group events (SkillGroupRenderer) ---

const skillToolUseId = uuid()

export const skillGroupEvents: TranscriptEvent[] = [
  userEvent('Commit these changes', ts(0)),
  assistantEvent([
    {
      type: 'tool_use',
      id: skillToolUseId,
      name: 'Skill',
      input: { skill: 'commit' },
    },
  ], ts(0, 3)),
  // Skill content (meta message with sourceToolUseID)
  userEvent(
    [
      {
        type: 'text',
        text: "## Commit Skill\n\nAnalyze the staged changes and create an appropriate commit message.\n\n### Steps\n1. Run `git status` and `git diff --cached`\n2. Analyze changes\n3. Create commit with descriptive message",
      },
    ],
    ts(0, 3),
    { isMeta: true, sourceToolUseID: skillToolUseId },
  ),
  // Skill result
  userEvent([
    {
      type: 'tool_result',
      tool_use_id: skillToolUseId,
      content: 'Skill commit loaded successfully.',
    },
  ], ts(0, 4)),
  assistantEvent([
    {
      type: 'text',
      text: "I'll follow the commit skill to create a proper commit for your changes.",
    },
  ], ts(0, 8)),
]

// --- Local command events (LocalCommandRenderer) ---

export const localCommandEvents: TranscriptEvent[] = (() => {
  const commandTime = ts(0)
  const commandEvent = userEvent(
    '<command-name>/review-pr</command-name>',
    commandTime,
  )
  const commandKey = commandEvent.uuid

  const outputEvent: TranscriptEvent = {
    uuid: uuid(),
    event_type: 'user',
    payload: {
      message: {
        content: '<local-command-stdout>Fetching PR #42...\n\nPR: Fix authentication middleware\nAuthor: @developer\nBranch: fix/auth-middleware → main\n\nFiles changed (3):\n  src/middleware/auth.ts     | +15 -8\n  src/utils/jwt.ts          | +3  -1\n  tests/auth.test.ts        | +42 -0\n\nAll checks passing ✓</local-command-stdout>',
      },
      timestamp: commandTime,
    },
    created_at: commandTime,
  }

  const summaryEvent: TranscriptEvent = {
    uuid: uuid(),
    event_type: 'user',
    payload: {
      message: {
        content: 'PR #42 "Fix authentication middleware" — 3 files changed, adds JWT validation and test coverage. All CI checks pass.',
      },
      timestamp: commandTime,
      isCompactSummary: true,
    },
    created_at: commandTime,
  }

  // Manually set up grouping by making the events sequential with same timestamp
  // The buildLocalCommandGroups function uses timestamps and ordering to group
  return [commandEvent, outputEvent, summaryEvent]
})()

// --- Empty events ---

export const emptyEvents: TranscriptEvent[] = []

// --- Full conversation (all block types) ---

export const fullConversation: TranscriptEvent[] = (() => {
  const events: TranscriptEvent[] = []
  let minute = 0

  // 1. User asks a question
  events.push(userEvent(
    'I need to add a dark mode toggle to the settings page. Can you help?',
    ts(minute),
  ))

  // 2. Assistant thinks and responds
  events.push(assistantEvent([
    {
      type: 'thinking',
      thinking: "The user wants to add a dark mode toggle. I should:\n1. Check the current theme implementation\n2. Find the settings page\n3. Add a toggle component\n4. Wire it up to the theme context\n\nLet me start by reading the existing theme setup.",
    },
    {
      type: 'text',
      text: "I'll help you add a dark mode toggle. Let me first check the current theme setup.",
    },
  ], ts(minute, 10)))

  // 3. Read tool
  const readId = uuid()
  events.push(assistantEvent([
    {
      type: 'tool_use',
      id: readId,
      name: 'Read',
      input: { file_path: '/home/user/project/src/contexts/ThemeContext.tsx' },
    },
  ], ts(++minute)))
  events.push(userEvent([
    {
      type: 'tool_result',
      tool_use_id: readId,
      content: "     1\timport { createContext, useContext, useState } from 'react'\n     2\t\n     3\ttype Theme = 'light' | 'dark'\n     4\t\n     5\tconst ThemeContext = createContext<{\n     6\t  theme: Theme\n     7\t  setTheme: (t: Theme) => void\n     8\t}>({ theme: 'light', setTheme: () => {} })\n     9\t\n    10\texport const useTheme = () => useContext(ThemeContext)\n    11\t\n    12\texport function ThemeProvider({ children }: { children: React.ReactNode }) {\n    13\t  const [theme, setTheme] = useState<Theme>('light')\n    14\t  return (\n    15\t    <ThemeContext.Provider value={{ theme, setTheme }}>\n    16\t      {children}\n    17\t    </ThemeContext.Provider>\n    18\t  )\n    19\t}\n",
    },
  ], ts(minute, 1)))

  // 4. Grep for settings page
  const grepId = uuid()
  events.push(assistantEvent([
    {
      type: 'text',
      text: "Good, there's a ThemeContext. Let me find the settings page.",
    },
    {
      type: 'tool_use',
      id: grepId,
      name: 'Grep',
      input: { pattern: 'Settings', path: '/home/user/project/src/pages' },
    },
  ], ts(++minute)))
  events.push(userEvent([
    {
      type: 'tool_result',
      tool_use_id: grepId,
      content: '/home/user/project/src/pages/Settings.tsx:1:export function Settings() {',
    },
  ], ts(minute, 1)))

  // 5. Edit to add toggle
  const editId = uuid()
  events.push(assistantEvent([
    {
      type: 'text',
      text: "Found it. I'll add the dark mode toggle to the Settings page.",
    },
    {
      type: 'tool_use',
      id: editId,
      name: 'Edit',
      input: {
        file_path: '/home/user/project/src/pages/Settings.tsx',
        old_string: 'export function Settings() {\n  return (\n    <div>\n      <h1>Settings</h1>\n    </div>\n  )\n}',
        new_string: "import { useTheme } from '../contexts/ThemeContext'\n\nexport function Settings() {\n  const { theme, setTheme } = useTheme()\n\n  return (\n    <div>\n      <h1>Settings</h1>\n      <label className=\"flex items-center gap-2\">\n        <input\n          type=\"checkbox\"\n          checked={theme === 'dark'}\n          onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}\n        />\n        Dark mode\n      </label>\n    </div>\n  )\n}",
      },
    },
  ], ts(++minute)))
  events.push(userEvent([
    {
      type: 'tool_result',
      tool_use_id: editId,
      content: 'The file /home/user/project/src/pages/Settings.tsx has been updated successfully.',
    },
  ], ts(minute, 1)))

  // 6. TodoWrite
  const todoId = uuid()
  events.push(assistantEvent([
    {
      type: 'tool_use',
      id: todoId,
      name: 'TodoWrite',
      input: {
        todos: [
          { content: 'Add ThemeContext provider', status: 'completed' },
          { content: 'Add dark mode toggle to Settings', status: 'completed' },
          { content: 'Persist theme preference to localStorage', status: 'pending' },
        ],
      },
    },
  ], ts(++minute)))
  events.push(userEvent([
    {
      type: 'tool_result',
      tool_use_id: todoId,
      content: 'Todos updated successfully.',
    },
  ], ts(minute, 1)))

  // 7. Final assistant message
  events.push(assistantEvent([
    {
      type: 'text',
      text: "Done! I've added a dark mode toggle to the Settings page. The toggle uses the existing `ThemeContext` to switch between light and dark modes.\n\nNext step would be persisting the preference to `localStorage` so it survives page reloads. Want me to do that?",
    },
  ], ts(++minute)))

  return events
})()
