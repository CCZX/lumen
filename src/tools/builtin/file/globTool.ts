import { stat } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import { z } from 'zod';
import type { AgentTool } from '../../types/index.js';
import { getWorkspaceRoot } from './workspacePath.js';

const GlobInputSchema = z.object({
  pattern: z.string().min(1, 'pattern is required.'),
  cwd: z.string().optional(),
});

export const globTool: AgentTool = {
  name: 'glob',
  description:
    'Find files matching a glob pattern in the workspace. Use this when you need to search for files by name pattern (e.g., "**/*.ts", "src/**/*.json"). Returns matching file paths sorted by modification time.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      pattern: {
        type: 'string',
        description:
          'Glob pattern to match files. Examples: "**/*.ts" for all TypeScript files, "src/**/*.json" for JSON files in src, "*.test.ts" for test files.',
      },
      cwd: {
        type: 'string',
        description: 'Optional directory to search in. Defaults to workspace root.',
      },
    },
    required: ['pattern'],
  },
  async execute(args: unknown): Promise<string> {
    try {
      const input = GlobInputSchema.parse(args);
      const workspaceRoot = getWorkspaceRoot();

      // Resolve the search directory
      const searchDir = input.cwd
        ? path.resolve(workspaceRoot, input.cwd)
        : workspaceRoot;

      // Verify search directory exists and is a directory
      try {
        const stats = await stat(searchDir);
        if (!stats.isDirectory()) {
          throw new Error(`Not a directory: ${input.cwd}`);
        }
      } catch (error) {
        if (isNodeError(error) && error.code === 'ENOENT') {
          throw new Error(`Directory not found: ${input.cwd ?? workspaceRoot}`);
        }
        throw error;
      }

      // Execute glob search
      const matches = await glob(input.pattern, {
        cwd: searchDir,
        nodir: true, // Only return files, not directories
        absolute: false,
        ignore: ['**/node_modules/**', '**/.git/**'], // Ignore common non-source directories
      });

      // Convert to relative paths from workspace root, normalized to forward slashes
      const relativePaths = (searchDir === workspaceRoot
        ? matches
        : matches.map(m => path.relative(workspaceRoot, path.join(searchDir, m)))
      ).map(p => p.replace(/\\/g, '/'));

      return JSON.stringify({
        pattern: input.pattern,
        cwd: input.cwd ?? '.',
        count: relativePaths.length,
        files: relativePaths,
      });
    } catch (error) {
      return JSON.stringify({
        error: (error as Error).message,
      });
    }
  },
};

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
