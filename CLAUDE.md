# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Run in development mode with Ink UI
pnpm dev --print "x"  # Non-interactive mode, prints result
pnpm build            # Build for distribution
pnpm start            # Run built binary
pnpm typecheck        # TypeScript type checking
pnpm lint             # Biome linting
pnpm format           # Biome formatting
pnpm test             # Run all tests
pnpm test unit file   # Run specific test file
```

## Code Style

所有代码注释必须使用中文。

## Architecture

### Config Flow
`ConfigManager` (config/ConfigManager.ts) loads config from env vars and CLI args → stored in Zustand vanilla store (`configStore`) → accessed by `Agent` via `configStore.getState().config`

### Agent
`Agent` (agent/Agent.ts) wraps OpenAI SDK with tool calling support. It uses `assembleSystemPrompt()` from `prompts/` to build the system message. Tool execution is delegated to the tool registry.

### Tool System
Tools are defined in `src/tools/builtin/` (file/, shell/) and registered in `src/tools/registry/index.ts`. Each tool implements `AgentTool` interface with `name`, `description`, `parameters`, and `execute()`.

### Prompt Structure
`src/prompts/` contains layered prompts:
- `system.ts` - core role definition
- `guidelines.ts` - behavioral rules
- `tools.ts` - tool descriptions
- `index.ts` - exports `assembleSystemPrompt()` to combine all layers

### UI
Ink + React components in `src/ui/`. `main.tsx` renders `<App />` via `render()`.