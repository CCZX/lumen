import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { globTool } from '../../src/tools/builtin/file/globTool.js';

let originalCwd: string;
let workspaceDir: string;

beforeEach(async () => {
  originalCwd = process.cwd();
  workspaceDir = await mkdtemp(path.join(tmpdir(), 'lumen-glob-test-'));
  process.chdir(workspaceDir);

  // Create test file structure:
  // .
  // ├── src/
  // │   ├── main.ts
  // │   ├── utils.ts
  // │   └── components/
  // │       └── Button.tsx
  // ├── tests/
  // │   └── main.test.ts
  // ├── package.json
  // └── README.md
  await mkdir(path.join(workspaceDir, 'src/components'), { recursive: true });
  await mkdir(path.join(workspaceDir, 'tests'), { recursive: true });

  await writeFile(path.join(workspaceDir, 'src/main.ts'), '// main');
  await writeFile(path.join(workspaceDir, 'src/utils.ts'), '// utils');
  await writeFile(path.join(workspaceDir, 'src/components/Button.tsx'), '// button');
  await writeFile(path.join(workspaceDir, 'tests/main.test.ts'), '// test');
  await writeFile(path.join(workspaceDir, 'package.json'), '{}');
  await writeFile(path.join(workspaceDir, 'README.md'), '# readme');
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(workspaceDir, { recursive: true, force: true });
});

describe('globTool', () => {
  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(globTool.name).toBe('glob');
    });

    it('should have a description', () => {
      expect(globTool.description).toBeTruthy();
    });

    it('should have required parameters', () => {
      expect(globTool.parameters.required).toContain('pattern');
    });
  });

  describe('execute', () => {
    it('should find all TypeScript files', async () => {
      const result = await globTool.execute({ pattern: '**/*.ts' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(parsed.count).toBe(3);
      expect(parsed.files).toContain('src/main.ts');
      expect(parsed.files).toContain('src/utils.ts');
      expect(parsed.files).toContain('tests/main.test.ts');
    });

    it('should find TSX files', async () => {
      const result = await globTool.execute({ pattern: '**/*.tsx' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(parsed.count).toBe(1);
      expect(parsed.files).toContain('src/components/Button.tsx');
    });

    it('should find JSON files', async () => {
      const result = await globTool.execute({ pattern: '*.json' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(parsed.count).toBe(1);
      expect(parsed.files).toContain('package.json');
    });

    it('should find files in specific directory', async () => {
      const result = await globTool.execute({ pattern: '**/*.ts', cwd: 'src' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(parsed.count).toBe(2);
      expect(parsed.files).toContain('src/main.ts');
      expect(parsed.files).toContain('src/utils.ts');
      expect(parsed.files).not.toContain('tests/main.test.ts');
    });

    it('should return error when pattern is missing', async () => {
      const result = await globTool.execute({});
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeDefined();
    });

    it('should return error when pattern is empty', async () => {
      const result = await globTool.execute({ pattern: '' });
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeDefined();
    });

    it('should return empty array when no matches', async () => {
      const result = await globTool.execute({ pattern: '**/*.py' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(parsed.count).toBe(0);
      expect(parsed.files).toEqual([]);
    });
  });
});
