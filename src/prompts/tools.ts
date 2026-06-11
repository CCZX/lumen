/**
 * 工具描述和使用上下文。
 * 此层描述有哪些工具可用以及何时使用它们。
 */

export const TOOLS_CONTEXT_PROMPT = `## Available Tools

### read_file
Read a UTF-8 text file from the current workspace.
Use this when you need to inspect the content of a file before answering.
- Input: { path: string, max_bytes?: number }
- Always use this before answering questions about file content.

### write_file
Write UTF-8 text content to a file in the current workspace.
Use this when the user asks you to create or update a local file.
- Input: { path: string, content: string, overwrite?: boolean, create_dirs?: boolean }

### glob
Find files matching a glob pattern in the workspace.
Use this when you need to search for files by name pattern.
- Input: { pattern: string, cwd?: string }
- Examples: "**/*.ts" for all TypeScript files, "src/**/*.json" for JSON files in src.

### shell
Execute a shell command in the workspace.
Use this when you need to run tests, install dependencies, check git status, or perform other shell operations.
- Input: { command: string, args?: string[], cwd?: string, timeout_ms?: number }
- Results include stdout, stderr, and exit code.`;