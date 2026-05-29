import { lstat, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';

export function isPathInside(parent: string, child: string): boolean {
  const relativePath = path.relative(parent, child);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

export async function resolveExistingWorkspacePath(inputPath: string): Promise<{
  workspaceRoot: string;
  filePath: string;
}> {
  const workspaceRoot = await realpath(process.cwd());
  const resolvedPath = path.resolve(workspaceRoot, inputPath);

  if (!isPathInside(workspaceRoot, resolvedPath)) {
    throw new Error(`Refusing to access outside workspace: ${inputPath}`);
  }

  const filePath = await realpath(resolvedPath);
  if (!isPathInside(workspaceRoot, filePath)) {
    throw new Error(`Refusing to access outside workspace: ${inputPath}`);
  }

  return { workspaceRoot, filePath };
}

export async function resolveWritableWorkspacePath(
  inputPath: string,
  options: { createDirs: boolean },
): Promise<{
  workspaceRoot: string;
  filePath: string;
}> {
  const workspaceRoot = await realpath(process.cwd());
  const filePath = path.resolve(workspaceRoot, inputPath);

  if (!isPathInside(workspaceRoot, filePath)) {
    throw new Error(`Refusing to write outside workspace: ${inputPath}`);
  }

  await ensureWritableParentDirectory(workspaceRoot, path.dirname(filePath), options.createDirs);

  return { workspaceRoot, filePath };
}

async function ensureWritableParentDirectory(
  workspaceRoot: string,
  parentDir: string,
  createDirs: boolean,
): Promise<void> {
  const relativeParentDir = path.relative(workspaceRoot, parentDir);

  if (relativeParentDir === '') {
    return;
  }

  let currentDir = workspaceRoot;
  for (const segment of relativeParentDir.split(path.sep)) {
    currentDir = path.join(currentDir, segment);

    try {
      const stats = await lstat(currentDir);
      if (stats.isSymbolicLink()) {
        throw new Error(`Refusing to write through symlink directory: ${currentDir}`);
      }
      if (!stats.isDirectory()) {
        throw new Error(`Parent path is not a directory: ${currentDir}`);
      }
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') {
        throw error;
      }
      if (!createDirs) {
        throw new Error(`Parent directory does not exist: ${parentDir}`);
      }

      await mkdir(currentDir);
    }
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
