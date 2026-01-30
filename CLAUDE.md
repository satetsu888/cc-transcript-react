# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for displaying Claude Code transcripts. Packaged as an ESM library with TypeScript types and compiled CSS, intended for external consumption.

## Commands

- `npm run build` — Build with tsup (outputs dist/index.js, dist/index.d.ts, dist/index.css)
- `npm run dev` — Watch mode build

No test runner or linter is configured.

## Architecture

### Data Processing Pipeline

Raw `TranscriptEvent[]` flows through three stages:

1. **Filter** (`filter-events.ts`) — Removes internal event types (system, summary, progress, file-history-snapshot)
2. **Expand** (`expand-events.ts`) — Transforms events into `DisplayBlock[]` with grouping logic:
   - Pairs `tool_use` with corresponding `tool_result` into `tool_group` blocks
   - Groups `Skill` tool invocations with their output into `skill_group` blocks
   - Groups local `/command` invocations with output and summary into `local_command_group` blocks
   - Extracts display-friendly labels and parameters from tool payloads
3. **Render** (`ClaudeCodeTranscript.tsx` → `ContentBlockCard.tsx`) — Renders DisplayBlocks with type-specific handlers

### Key Design Decisions

- **Tailwind prefix `cct-`**: All Tailwind classes use this prefix to avoid conflicts when the component is embedded in host applications. Preflight is disabled for the same reason. The `cn()` utility in `cn.ts` handles merging with this prefix.
- **Custom block renderers**: Consumers can override rendering for specific tools or block types via `customBlockRenderers` prop.
- **Path display**: Tool labels show paths relative to `projectPath` prop when provided, with smart shortening logic.

### Public API (src/index.ts)

Exports: `ClaudeCodeTranscript` component, processing utilities (`filterHiddenEvents`, `expandEvents`, `extractMessageBlocks`), and all relevant types.
