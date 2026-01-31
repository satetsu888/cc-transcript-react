import { exec } from 'node:child_process'
import { platform } from 'node:os'
import { startServer } from './server.js'

interface CliArgs {
  port: number
  colorScheme: 'light' | 'dark'
  sessionId?: string
  help: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    port: 3333,
    colorScheme: 'light',
    help: false,
  }

  const rest = argv.slice(2)
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]
    if (arg === '-h' || arg === '--help') {
      args.help = true
    } else if (arg === '--dark') {
      args.colorScheme = 'dark'
    } else if (arg === '-p' || arg === '--port') {
      const val = rest[++i]
      if (val) args.port = parseInt(val, 10)
    } else if (!arg.startsWith('-')) {
      args.sessionId = arg
    }
  }

  return args
}

function showHelp() {
  console.log(`
cc-transcript-react - Claude Code transcript viewer

Usage:
  npx cc-transcript-react [options] [session-id]

Arguments:
  session-id          Show only this session (opens directly)

Options:
  -p, --port <number> Port number (default: 3333)
  --dark              Use dark theme
  -h, --help          Show this help
`.trim())
}

function openBrowser(url: string) {
  const cmd = platform() === 'darwin' ? 'open'
    : platform() === 'win32' ? 'start'
    : 'xdg-open'
  exec(`${cmd} ${url}`)
}

async function main() {
  const args = parseArgs(process.argv)

  if (args.help) {
    showHelp()
    process.exit(0)
  }

  try {
    const server = await startServer({
      port: args.port,
      colorScheme: args.colorScheme,
      sessionId: args.sessionId,
    })

    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : args.port
    const url = `http://localhost:${port}`

    console.log(`Claude Code transcript viewer running at ${url}`)
    console.log('Press Ctrl+C to stop')

    openBrowser(url)
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      console.error(`Port ${args.port} is already in use. Try a different port with -p <port>`)
    } else {
      console.error('Failed to start server:', err)
    }
    process.exit(1)
  }
}

main()
