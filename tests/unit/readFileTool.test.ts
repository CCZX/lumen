import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileTool } from '../../src/tools/builtin/file/index.js';

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

describe('readFileTool', () => {
  it('reads a text file from the current workspace', async () => {
    await writeFile(path.join(workspaceDir, 'README.md'), 'hello lumen', 'utf8');

    const result = JSON.parse(await readFileTool.execute({ path: 'README.md' }));

    expect(result).toMatchObject({
      path: 'README.md',
      bytes_read: 11,
      truncated: false,
      content: 'hello lumen',
    });
  });

  it('truncates large files at max_bytes', async () => {
    await writeFile(path.join(workspaceDir, 'large.txt'), 'abcdef', 'utf8');

    const result = JSON.parse(
      await readFileTool.execute({
        path: 'large.txt',
        max_bytes: 3,
      }),
    );

    expect(result).toMatchObject({
      bytes_read: 3,
      truncated: true,
      content: 'abc',
    });
  });

  it('refuses paths outside the current workspace', async () => {
    const outsideFile = path.join(outsideDir, 'secret.txt');
    await writeFile(outsideFile, 'secret', 'utf8');

    const result = JSON.parse(await readFileTool.execute({ path: outsideFile }));

    expect(result.error).toContain('Refusing to read outside workspace');
  });
});
