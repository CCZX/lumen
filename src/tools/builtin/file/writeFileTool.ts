import { lstat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { AgentTool } from '../../types/index.js';
import { resolveWritableWorkspacePath } from './workspacePath.js';

const WriteFileInputSchema = z.object({
  path: z.string().min(1, 'path is required.'),
  content: z.string(),
  overwrite: z.boolean().optional(),
  create_dirs: z.boolean().optional(),
});

export const writeFileTool: AgentTool = {
  name: 'write_file',
  description:
    'Write UTF-8 text content to a file in the current workspace. Use this when the user asks you to create or update a local file.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      path: {
        type: 'string',
        description:
          'Path to the file, relative to the current workspace. Absolute paths are only allowed when they still point inside the workspace.',
      },
      content: {
        type: 'string',
        description: 'Complete UTF-8 text content to write to the file.',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite an existing file. Defaults to true.',
      },
      create_dirs: {
        type: 'boolean',
        description: 'Whether to create missing parent directories. Defaults to false.',
      },
    },
    required: ['path', 'content'],
  },
  async execute(args: unknown): Promise<string> {
    try {
      const input = WriteFileInputSchema.parse(args);
      const overwrite = input.overwrite ?? true;
      const { workspaceRoot, filePath } = await resolveWritableWorkspacePath(input.path, {
        createDirs: input.create_dirs ?? false,
      });

      const previousExists = await checkWritableTarget(filePath, input.path);
      if (previousExists && !overwrite) {
        throw new Error(`File already exists: ${input.path}`);
      }

      await writeFile(filePath, input.content, 'utf8');

      return JSON.stringify({
        path: path.relative(workspaceRoot, filePath),
        bytes_written: Buffer.byteLength(input.content, 'utf8'),
        overwritten: previousExists,
      });
    } catch (error) {
      return JSON.stringify({
        error: (error as Error).message,
      });
    }
  },
};

async function checkWritableTarget(filePath: string, inputPath: string): Promise<boolean> {
  try {
    const stats = await lstat(filePath);
    if (stats.isSymbolicLink()) {
      throw new Error(`Refusing to write through symlink file: ${inputPath}`);
    }
    if (!stats.isFile()) {
      throw new Error(`Not a file: ${inputPath}`);
    }

    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
