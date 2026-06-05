#!/usr/bin/env tsx
/**
 * 独立测试脚本：验证 shellTool 功能
 * 运行：pnpm exec tsx scripts/test-shell.ts
 */

import { shellTool } from '../src/tools/builtin/shell/shellTool.js';

async function main() {
  console.log('🔧 测试 shellTool\n');
  console.log('当前工作目录:', process.cwd());
  console.log('---\n');

  // 测试 1: 简单命令
  console.log('📝 测试 1: 执行 echo 命令');
  const result1 = await shellTool.execute({ command: 'echo', args: ['Hello from shellTool!'] });
  const parsed1 = JSON.parse(result1);
  console.log('结果:', JSON.stringify(parsed1, null, 2));
  console.log('\n---\n');

  // 测试 2: Node.js 命令
  console.log('🟢 测试 2: 执行 node -e "console.log(1+1)"');
  const result2 = await shellTool.execute({ command: 'node', args: ['-e', 'console.log(1+1)'] });
  const parsed2 = JSON.parse(result2);
  console.log('结果:', JSON.stringify(parsed2, null, 2));
  console.log('\n---\n');

  // 测试 3: git status
  console.log('📦 测试 3: 执行 git status');
  const result3 = await shellTool.execute({ command: 'git', args: ['status', '--short'] });
  const parsed3 = JSON.parse(result3);
  console.log('结果:', JSON.stringify(parsed3, null, 2));
  console.log('\n---\n');

  // 测试 4: npm test
  console.log('🧪 测试 4: 执行 npm test (带超时)');
  const result4 = await shellTool.execute({ command: 'npm', args: ['test'], timeout_ms: 30000 });
  const parsed4 = JSON.parse(result4);
  console.log('退出码:', parsed4.exit_code);
  console.log('stdout 前 200 字符:', parsed4.stdout?.substring(0, 200));
  console.log('stderr 前 200 字符:', parsed4.stderr?.substring(0, 200));
  console.log('\n---\n');

  // 测试 5: 危险命令被拒绝
  console.log('🚫 测试 5: 尝试执行危险命令 (sudo)');
  const result5 = await shellTool.execute({ command: 'sudo', args: ['ls'] });
  const parsed5 = JSON.parse(result5);
  console.log('结果:', JSON.stringify(parsed5, null, 2));
}

main().catch(console.error);
