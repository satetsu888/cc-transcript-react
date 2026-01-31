# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for displaying Claude Code transcripts. Packaged as an ESM library with TypeScript types and compiled CSS, intended for external consumption.

## Commands

- `npm run build` — Build with tsup (outputs dist/index.js, dist/headless.js, dist/index.d.ts, dist/index.css)
- `npm run dev` — Watch mode build
- `npm run storybook` — Start Storybook dev server on port 6006
- `npm run build-storybook` — Build static Storybook to `storybook-static/`

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

### Code Placement Rules

#### core/ vs react/ の判断基準

- **`core/` に置くもの**: React や DOM に依存しないコード。型定義、データ変換ロジック、文字列操作ユーティリティなど。`import React` や JSX を含んではいけない。
- **`react/` に置くもの**: React コンポーネント、hooks、React Context、CSS、Tailwind クラス文字列など。

**依存方向**: `react/` → `core/` は OK。`core/` → `react/` は禁止。`core/` 内のファイルは `react/` の存在を知らない。

#### react/ 内の配置

| 置き場所 | 何を置くか |
|----------|-----------|
| `react/types.ts` | React に依存する型 (`React.CSSProperties` を使う型など) |
| `react/context.ts` | TranscriptContext の定義。新しいコンテキスト値を追加する場合はここ |
| `react/ClaudeCodeTranscript.tsx` | 公開 props の定義、Provider のセットアップ |
| `react/components/block-classification.ts` | blockType の分類判定 (pure 関数、React 不要) |
| `react/components/block-styles.ts` | Tailwind クラス文字列定数、アイコン選択、コンテナスタイル |
| `react/components/*.tsx` | 複数のレンダラーから共有されるコンポーネント (CodeBlock, MarkdownContent 等) |
| `react/components/renderers/*.tsx` | 特定 blockType のレンダリングロジック。そのブロック固有のデータ抽出ヘルパーもここ |

#### 新しい blockType を追加する手順

1. `core/expand-events.ts` で新しい blockType を持つ `DisplayBlock` を生成するロジックを追加
2. `react/components/renderers/` に `XxxRenderer.tsx` を作成
3. `react/components/renderers/index.tsx` の `DEFAULT_RENDERERS` に登録
4. (必要なら) `block-classification.ts` の `SECONDARY_BLOCK_TYPES` に追加

#### 新しい CSS 変数 (テーマトークン) を追加する手順

1. `react/styles.css` の light テーマ・dark テーマ両方に `--cct-xxx` を追加
2. コンポーネントでは `cct-text-[var(--cct-xxx)]` のように Tailwind の arbitrary value で参照

#### コンテキスト経由で値を共有する場合

新しい設定値をレンダラーに渡す場合:
1. `react/context.ts` の `TranscriptContextValue` にフィールドを追加
2. `react/ClaudeCodeTranscript.tsx` の props と `contextValue` の組み立てに追加
3. レンダラーでは `useTranscriptContext()` で取得

### Storybook

- **Config**: `.storybook/main.ts` (React + Vite framework), `.storybook/preview.ts` (CSS import, backgrounds)
- **Stories**: `src/stories/ClaudeCodeTranscript.stories.tsx` — FullConversation, WithThinking, WithToolGroup, WithTodoList, WithAskUserQuestion, WithSkillGroup, WithLocalCommand, WithCustomRenderer, Empty
- **Fixtures**: `src/stories/fixtures/sample-events.ts` — Sample `TranscriptEvent[]` data covering all renderer types
- **Deployment**: `.github/workflows/deploy-storybook.yml` — GitHub Actions workflow deploys to GitHub Pages on push to main. Requires repository Settings → Pages → Source を "GitHub Actions" に設定する。

### Key Design Decisions

- **Tailwind prefix `cct-`**: All Tailwind classes use this prefix to avoid conflicts when the component is embedded in host applications. Preflight is disabled for the same reason. The `cn()` utility in `react/cn.ts` handles merging with this prefix.
- **CSS custom properties**: All colors use `--cct-*` variables defined in `react/styles.css`, with light/dark theme variants via `[data-cct-theme]` attribute.
- **Scoped box-sizing reset**: `styles.css` に `[data-cct-root] * { box-sizing: border-box; }` を定義している。Preflight が無効なため、ブラウザデフォルトの `content-box` だと `width: 100%` + `padding` で親要素をはみ出す問題が発生する。このスコープ付きリセットでホストアプリに影響を与えずに解決している。
- **Button element resets**: Preflight 無効のため `<button>` にブラウザデフォルトの背景・ボーダーが残る。ボタン要素には `cct-appearance-none cct-border-0 cct-bg-transparent` を明示的に付与すること。
- **TranscriptContext**: Theme settings (codeTheme, classNames, customBlockRenderers) are provided via React Context to avoid prop drilling through renderers.
- **Renderer registry**: blockType → component mapping in `renderers/index.tsx`. Adding a new block type = new renderer file + one line in the registry.
- **Custom block renderers**: Consumers can override rendering for specific tools or block types via `customBlockRenderers` prop.
- **Environment-agnostic permalink/clipboard**: `generatePermalink` and `copyToClipboard` props allow non-browser environments to provide custom implementations.
- **Path display**: Tool labels show paths relative to `projectPath` prop when provided, with smart shortening logic.

### Public API (src/index.ts)

Exports: `ClaudeCodeTranscript` component, processing utilities (`filterHiddenEvents`, `expandEvents`, `extractMessageBlocks`), and all relevant types.

### Headless API (src/headless.ts)

Exports: processing utilities and types only. No React dependency. Useful for React Native, Node.js scripts, or custom renderers.

## Release

npm パッケージのリリースは GitHub Release をトリガーに GitHub Actions (OIDC Trusted Publishing) で自動実行される。

### リリース手順

1. `package.json` の `version` を更新してコミット・マージ
2. GitHub で Release を作成:
   - Tag: `v<version>`（例: `v0.2.0`）を新規作成
   - Title: `v<version>`
   - "Generate release notes" で変更内容を自動生成
3. Release を publish すると `.github/workflows/release.yml` が `npm publish --provenance --access public` を実行
