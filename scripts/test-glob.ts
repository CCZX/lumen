#!/usr/bin/env tsx
/**
 * 独立测试脚本：验证 globTool 功能
 * 运行：pnpm exec tsx scripts/test-glob.ts
 */

import { globTool } from '../src/tools/builtin/file/globTool.js';

async function main() {
  console.log('🔍 测试 globTool\n');
  console.log('当前工作目录:', process.cwd());
  console.log('---\n');

  // 测试 1: 查找所有 TypeScript 文件
  console.log('📝 测试 1: 查找所有 TypeScript 文件 (**/*.ts)');
  const result1 = await globTool.execute({ pattern: '**/*.ts' });
  const parsed1 = JSON.parse(result1);
  console.log('结果:', JSON.stringify(parsed1, null, 2));
  console.log('\n---\n');

  // 测试 2: 查找 JSON 文件
  console.log('📄 测试 2: 查找 JSON 文件 (*.json)');
  const result2 = await globTool.execute({ pattern: '*.json' });
  const parsed2 = JSON.parse(result2);
  console.log('结果:', JSON.stringify(parsed2, null, 2));
  console.log('\n---\n');

  // 测试 3: 在 src 目录查找
  console.log('📁 测试 3: 在 src 目录查找 TypeScript 文件');
  const result3 = await globTool.execute({ pattern: '**/*.ts', cwd: 'src' });
  const parsed3 = JSON.parse(result3);
  console.log('结果:', JSON.stringify(parsed3, null, 2));
  console.log('\n---\n');

  // 测试 4: 无匹配
  console.log('❓ 测试 4: 查找不存在的文件类型 (**/*.xyz)');
  const result4 = await globTool.execute({ pattern: '**/*.xyz' });
  const parsed4 = JSON.parse(result4);
  console.log('结果:', JSON.stringify(parsed4, null, 2));
}

main().catch(console.error);
