import { spawn } from 'node:child_process';
import path from 'node:path';
import { z } from 'zod';
import type { AgentTool } from '../../types/index.js';
import { getWorkspaceRoot } from '../file/workspacePath.js';

const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes
const MAX_OUTPUT_BYTES = 100_000; // 100KB

const ShellInputSchema = z.object({
  command: z.string().min(1, 'command is required.'),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
  timeout_ms: z.number().int().positive().max(300_000).optional(),
});

// Basic safety: block obviously dangerous patterns
const DANGEROUS_PATTERNS = [
  /^rm\s+-rf\s+\/$/i, // rm -rf /
  /^rm\s+-rf\s+\~$/i, // rm -rf ~
  /^sudo\s+/i, // sudo
  /^chmod\s+777/i, // chmod 777
  /^:\(\)\s*\{\s*:\|:\s*&\s*\}\s*;\s*:/i, // fork bomb
];

function isDangerousCommand(command: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command));
}

export const shellTool: AgentTool = {
  name: 'shell',
  description:
    'Execute a shell command in the workspace. Use this when you need to run tests, install dependencies, check git status, or perform other shell operations. Results include stdout, stderr, and exit code.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      command: {
        type: 'string',
        description:
          'The command to execute (e.g., "npm", "git", "ls"). Do not include arguments here.',
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Arguments for the command (e.g., ["test", "--run"] for "npm test --run").',
      },
      cwd: {
        type: 'string',
        description: 'Directory to run the command in. Defaults to workspace root.',
      },
      timeout_ms: {
        type: 'integer',
        description: `Timeout in milliseconds. Defaults to ${DEFAULT_TIMEOUT_MS}. Maximum 300000 (5 minutes).`,
        minimum: 1,
        maximum: 300_000,
      },
    },
    required: ['command'],
  },
  async execute(args: unknown): Promise<string> {
    try {
      const input = ShellInputSchema.parse(args);
      const workspaceRoot = getWorkspaceRoot();

      // Safety check
      const fullCommand = input.args
        ? `${input.command} ${input.args.join(' ')}`
        : input.command;
      if (isDangerousCommand(fullCommand)) {
        throw new Error(`Refusing to execute potentially dangerous command: ${fullCommand}`);
      }

      // Resolve working directory
      const cwd = input.cwd
        ? path.resolve(workspaceRoot, input.cwd)
        : workspaceRoot;

      // Verify cwd is inside workspace
      const relativeCwd = path.relative(workspaceRoot, cwd);
      if (relativeCwd.startsWith('..') || path.isAbsolute(relativeCwd)) {
        throw new Error(`Refusing to execute outside workspace: ${input.cwd}`);
      }

      const timeoutMs = input.timeout_ms ?? DEFAULT_TIMEOUT_MS;

      // Execute command
      const result = await runCommand(
        input.command,
        input.args ?? [],
        cwd,
        timeoutMs,
      );

      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: (error as Error).message,
      });
    }
  },
};

interface CommandResult {
  command: string;
  args: string[];
  cwd: string;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  timed_out: boolean;
  truncated: boolean;
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<CommandResult> {
  return new Promise((resolve) => {
    let stdoutBuffer = Buffer.alloc(0);
    let stderrBuffer = Buffer.alloc(0);
    let timedOut = false;

    const proc = spawn(command, args, {
      cwd,
      shell: true,
      timeout: timeoutMs,
    });

    proc.stdout.on('data', (data: Buffer) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
      if (stdoutBuffer.length > MAX_OUTPUT_BYTES) {
        stdoutBuffer = stdoutBuffer.subarray(0, MAX_OUTPUT_BYTES);
      }
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderrBuffer = Buffer.concat([stderrBuffer, data]);
      if (stderrBuffer.length > MAX_OUTPUT_BYTES) {
        stderrBuffer = stderrBuffer.subarray(0, MAX_OUTPUT_BYTES);
      }
    });

    proc.on('close', (code) => {
      resolve({
        command,
        args,
        cwd,
        exit_code: code,
        stdout: stdoutBuffer.toString('utf8'),
        stderr: stderrBuffer.toString('utf8'),
        timed_out: timedOut,
        truncated: stdoutBuffer.length >= MAX_OUTPUT_BYTES || stderrBuffer.length >= MAX_OUTPUT_BYTES,
      });
    });

    proc.on('error', (err) => {
      resolve({
        command,
        args,
        cwd,
        exit_code: null,
        stdout: '',
        stderr: err.message,
        timed_out: false,
        truncated: false,
      });
    });

    // Handle timeout via spawn's timeout option (Node 20+)
    // Note: spawn timeout kills the process, we detect via exit_code being null in some cases
    setTimeout(() => {
      if (proc.exitCode === null) {
        timedOut = true;
        proc.kill();
      }
    }, timeoutMs);

    // Also handle spawn's built-in timeout (for Node 20+)
    proc.on('timeout', () => {
      timedOut = true;
    });
  });
}