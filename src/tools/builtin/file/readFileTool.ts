import { constants } from 'node:fs';
import { access, open, stat } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { AgentTool } from '../../types/index.js';
import { resolveExistingWorkspacePath } from './workspacePath.js';

const DEFAULT_MAX_BYTES = 200_000;
const HARD_MAX_BYTES = 1_000_000;

const ReadFileInputSchema = z.object({
  path: z.string().min(1, 'path is required.'),
  max_bytes: z.number().int().positive().max(HARD_MAX_BYTES).optional(),
});

async function readFileContent(filePath: string, maxBytes: number): Promise<Buffer> {
  const fileHandle = await open(filePath, 'r');

  try {
    const buffer = Buffer.alloc(maxBytes);
    const { bytesRead } = await fileHandle.read(buffer, 0, maxBytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await fileHandle.close();
  }
}

export const readFileTool: AgentTool = {
  name: 'read_file',
  description:
    'Read a UTF-8 text file from the current workspace. Use this before answering questions that require inspecting local source files.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      path: {
        type: 'string',
        description:
          'Path to the file, relative to the current workspace. Absolute paths are only allowed when they still point inside the workspace.',
      },
      max_bytes: {
        type: 'integer',
        description: `Maximum bytes to read. Defaults to ${DEFAULT_MAX_BYTES}.`,
        minimum: 1,
        maximum: HARD_MAX_BYTES,
      },
    },
    required: ['path'],
  },
  async execute(args: unknown): Promise<string> {
    try {
      const input = ReadFileInputSchema.parse(args);
      const maxBytes = input.max_bytes ?? DEFAULT_MAX_BYTES;
      const { workspaceRoot, filePath } = await resolveExistingWorkspacePath(input.path);

      await access(filePath, constants.R_OK);

      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        throw new Error(`Not a file: ${input.path}`);
      }

      const content = await readFileContent(filePath, maxBytes);

      return JSON.stringify({
        path: path.relative(workspaceRoot, filePath),
        bytes_read: content.length,
        truncated: fileStat.size > content.length,
        content: content.toString('utf8'),
      });
    } catch (error) {
      return JSON.stringify({
        error: (error as Error).message,
      });
    }
  },
};
