import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeFileTool } from '../../src/tools/builtin/file/index.js';

let originalCwd: string;
let workspaceDir: string;
let outsideDir: string;

beforeEach(async () => {
  originalCwd = process.cwd();
  workspaceDir = await mkdtemp(path.join(tmpdir(), 'lumen-workspace-'));
  outsideDir = await mkdtemp(path.join(tmpdir(), 'lumen-outside-'));
  process.chdir(workspaceDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(workspaceDir, { recursive: true, force: true });
  await rm(outsideDir, { recursive: true, force: true });
});

describe('writeFileTool', () => {
  it('writes a text file in the current workspace', async () => {
    const result = JSON.parse(
      await writeFileTool.execute({
        path: 'notes.txt',
        content: 'hello lumen',
      }),
    );

    await expect(readFile(path.join(workspaceDir, 'notes.txt'), 'utf8')).resolves.toBe(
      'hello lumen',
    );
    expect(result).toMatchObject({
      path: 'notes.txt',
      bytes_written: 11,
      overwritten: false,
    });
  });

  it('creates parent directories when requested', async () => {
    const result = JSON.parse(
      await writeFileTool.execute({
        path: 'docs/notes.txt',
        content: 'nested',
        create_dirs: true,
      }),
    );

    await expect(readFile(path.join(workspaceDir, 'docs/notes.txt'), 'utf8')).resolves.toBe(
      'nested',
    );
    expect(result).toMatchObject({
      path: 'docs/notes.txt',
      bytes_written: 6,
      overwritten: false,
    });
  });

  it('refuses to overwrite when overwrite is false', async () => {
    await writeFile(path.join(workspaceDir, 'notes.txt'), 'original', 'utf8');

    const result = JSON.parse(
      await writeFileTool.execute({
        path: 'notes.txt',
        content: 'changed',
        overwrite: false,
      }),
    );

    await expect(readFile(path.join(workspaceDir, 'notes.txt'), 'utf8')).resolves.toBe('original');
    expect(result.error).toContain('File already exists');
  });

  it('refuses paths outside the current workspace', async () => {
    const outsideFile = path.join(outsideDir, 'secret.txt');

    const result = JSON.parse(
      await writeFileTool.execute({
        path: outsideFile,
        content: 'secret',
      }),
    );

    expect(result.error).toContain('Refusing to write outside workspace');
  });
});
