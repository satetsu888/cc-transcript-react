# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for displaying Claude Code transcripts. Packaged as an ESM library with TypeScript types and compiled CSS, intended for external consumption.

## Commands

- `npm run build` — Build with tsup (outputs dist/index.js, dist/headless.js, dist/index.d.ts, dist/index.css)
- `npm run dev` — Watch mode build

No test runner or linter is configured.

## Architecture

### Two-Layer Structure

The codebase is split into two layers:

- **`src/core/`** — Environment-agnostic data processing (no React, no DOM). Types, event filtering, event expansion, content utilities.
- **`src/react/`** — React DOM rendering layer. Components, theming, context, styles.

### Entry Points

- **`src/index.ts`** — Main entry. Exports the React component, all types, and processing utilities. Imports CSS.
- **`src/headless.ts`** — Headless entry (`./headless`). Exports only `core/` types and functions. No React or DOM dependency.

### Data Processing Pipeline (core/)

Raw `TranscriptEvent[]` flows through three stages:

1. **Filter** (`core/filter-events.ts`) — Removes internal event types (system, summary, progress, file-history-snapshot)
2. **Expand** (`core/expand-events.ts`) — Transforms events into `DisplayBlock[]` with grouping logic:
   - Pairs `tool_use` with corresponding `tool_result` into `tool_group` blocks
   - Groups `Skill` tool invocations with their output into `skill_group` blocks
   - Groups local `/command` invocations with output and summary into `local_command_group` blocks
   - Extracts display-friendly labels and parameters from tool payloads
3. **Render** (react/) — Renders DisplayBlocks via registry-based renderers

### Rendering Architecture (react/)

- **`ClaudeCodeTranscript.tsx`** — Top-level component. Sets up `TranscriptProvider` context with theme, classNames, and callbacks.
- **`context.ts`** — `TranscriptContext` provides codeTheme, classNames, customBlockRenderers, and permalink/clipboard callbacks to all descendants. Eliminates prop drilling.
- **`components/ContentBlockCard.tsx`** — Layout and collapse behavior. Delegates content rendering to the renderer registry.
- **`components/renderers/index.tsx`** — Registry that maps `blockType` → renderer component. Custom renderers (by tool name or blockType) are checked first.
- **`components/renderers/*.tsx`** — Individual renderers: TextRenderer, ThinkingRenderer, ToolGroupRenderer, SkillGroupRenderer, LocalCommandRenderer, TodoRenderer, AskUserQuestionRenderer, ToolUseRenderer, FallbackRenderer.
- **`components/CodeBlock.tsx`** — Shared SyntaxHighlighter wrapper. Gets theme from context.
- **`components/MarkdownContent.tsx`** — Shared Markdown renderer. Gets code theme from context.
- **`components/block-styles.ts`** — Container styles, icon selection, prose class constants.
- **`components/block-classification.ts`** — Block type classification (isSecondaryBlock, shouldExpandByDefault).

### Key Design Decisions

- **Tailwind prefix `cct-`**: All Tailwind classes use this prefix to avoid conflicts when the component is embedded in host applications. Preflight is disabled for the same reason. The `cn()` utility in `react/cn.ts` handles merging with this prefix.
- **CSS custom properties**: All colors use `--cct-*` variables defined in `react/styles.css`, with light/dark theme variants via `[data-cct-theme]` attribute.
- **TranscriptContext**: Theme settings (codeTheme, classNames, customBlockRenderers) are provided via React Context to avoid prop drilling through renderers.
- **Renderer registry**: blockType → component mapping in `renderers/index.tsx`. Adding a new block type = new renderer file + one line in the registry.
- **Custom block renderers**: Consumers can override rendering for specific tools or block types via `customBlockRenderers` prop.
- **Environment-agnostic permalink/clipboard**: `generatePermalink` and `copyToClipboard` props allow non-browser environments to provide custom implementations.
- **Path display**: Tool labels show paths relative to `projectPath` prop when provided, with smart shortening logic.

### Public API (src/index.ts)

Exports: `ClaudeCodeTranscript` component, processing utilities (`filterHiddenEvents`, `expandEvents`, `extractMessageBlocks`), and all relevant types.

### Headless API (src/headless.ts)

Exports: processing utilities and types only. No React dependency. Useful for React Native, Node.js scripts, or custom renderers.
