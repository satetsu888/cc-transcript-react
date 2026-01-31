import type { Meta, StoryObj } from '@storybook/react'
import { ClaudeCodeTranscript } from '../react/ClaudeCodeTranscript'
import {
  thinkingEvents,
  toolGroupEvents,
  todoEvents,
  askUserQuestionEvents,
  skillGroupEvents,
  localCommandEvents,
  emptyEvents,
  fullConversation,
} from './fixtures/sample-events'

const meta = {
  title: 'ClaudeCodeTranscript',
  component: ClaudeCodeTranscript,
  argTypes: {
    colorScheme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
    },
    projectPath: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    colorScheme: 'light',
  },
  decorators: [
    (Story, context) => {
      const colorScheme = context.args.colorScheme ?? 'light'
      return (
        <div style={{
          backgroundColor: colorScheme === 'dark' ? '#111827' : '#f9fafb',
          padding: '2rem',
          minHeight: '100vh',
        }}>
          <Story />
        </div>
      )
    },
  ],
} satisfies Meta<typeof ClaudeCodeTranscript>

export default meta
type Story = StoryObj<typeof meta>

// --- Stories ---

export const FullConversation: Story = {
  args: {
    events: fullConversation,
    projectPath: '/home/user/project',
  },
}

export const WithThinking: Story = {
  args: {
    events: thinkingEvents,
  },
}

export const WithToolGroup: Story = {
  args: {
    events: toolGroupEvents,
    projectPath: '/home/user/project',
  },
}

export const WithTodoList: Story = {
  args: {
    events: todoEvents,
  },
}

export const WithAskUserQuestion: Story = {
  args: {
    events: askUserQuestionEvents,
  },
}

export const WithSkillGroup: Story = {
  args: {
    events: skillGroupEvents,
  },
}

export const WithLocalCommand: Story = {
  args: {
    events: localCommandEvents,
  },
}

export const WithCustomRenderer: Story = {
  args: {
    events: toolGroupEvents,
    projectPath: '/home/user/project',
    customBlockRenderers: {
      Read: (block) => {
        const content = block.content as Record<string, unknown>
        const input = content?.input as Record<string, unknown> | undefined
        return (
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Custom Read Renderer
            </div>
            <div>File: {input?.file_path as string}</div>
          </div>
        )
      },
    },
  },
}

export const Empty: Story = {
  args: {
    events: emptyEvents,
  },
}
