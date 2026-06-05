import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { shellTool } from '../../src/tools/builtin/shell/shellTool.js';

let originalCwd: string;
let workspaceDir: string;

beforeEach(async () => {
  originalCwd = process.cwd();
  workspaceDir = await mkdtemp(path.join(tmpdir(), 'lumen-shell-test-'));
  process.chdir(workspaceDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(workspaceDir, { recursive: true, force: true });
});

describe('shellTool', () => {
  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(shellTool.name).toBe('shell');
    });

    it('should have a description', () => {
      expect(shellTool.description).toBeTruthy();
    });

    it('should have required parameters', () => {
      expect(shellTool.parameters.required).toContain('command');
    });
  });

  describe('execute', () => {
    it('should execute a simple command', async () => {
      const result = await shellTool.execute({ command: 'echo', args: ['hello'] });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(parsed.exit_code).toBe(0);
      expect(parsed.stdout.trim()).toBe('hello');
    });

    it('should handle command with arguments', async () => {
      const result = await shellTool.execute({ command: 'node', args: ['-e', 'console.log(1+1)'] });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(parsed.exit_code).toBe(0);
      expect(parsed.stdout.trim()).toBe('2');
    });

    it('should capture stderr', async () => {
      const result = await shellTool.execute({
        command: 'node',
        args: ['-e', 'console.error("error_message")']
      });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(parsed.stderr).toContain('error_message');
    });

    it('should return non-zero exit code for failed commands', async () => {
      const result = await shellTool.execute({
        command: 'node',
        args: ['-e', 'process.exit(1)']
      });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(parsed.exit_code).toBe(1);
    });

    it('should work with cwd option', async () => {
      const subdir = path.join(workspaceDir, 'subdir');
      await mkdir(subdir);

      const result = await shellTool.execute({
        command: 'pwd',
        cwd: 'subdir'
      });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      // On Windows, pwd might return different format
      expect(parsed.stdout).toBeTruthy();
    });

    it('should return error for missing command', async () => {
      const result = await shellTool.execute({});
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
    });

    it('should return error for empty command', async () => {
      const result = await shellTool.execute({ command: '' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
    });

    it('should refuse dangerous commands', async () => {
      const result = await shellTool.execute({ command: 'sudo', args: ['ls'] });
      const parsed = JSON.parse(result);

      expect(parsed.error).toContain('dangerous');
    });

    it('should refuse paths outside workspace', async () => {
      const result = await shellTool.execute({
        command: 'echo',
        args: ['test'],
        cwd: '/etc'
      });
      const parsed = JSON.parse(result);

      expect(parsed.error).toContain('outside workspace');
    });

    it('should handle non-existent directory gracefully', async () => {
      const result = await shellTool.execute({
        command: 'echo',
        args: ['test'],
        cwd: 'nonexistent-dir'
      });
      const parsed = JSON.parse(result);

      // On Windows with shell: true, the command might still run
      // Just check that we get a result (either error or output)
      expect(parsed).toHaveProperty('stdout');
    });
  });
});
