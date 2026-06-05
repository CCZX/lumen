#!/usr/bin/env tsx
/**
 * 非交互式测试：验证 Agent 能否正确调用工具
 * 运行：pnpm exec tsx scripts/test-agent.ts
 */

import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { Agent } from '../src/agent/Agent.js';
import { ConfigManager } from '../src/config/ConfigManager.js';
import { configStore } from '../src/store/configStore.js';

async function main() {
  console.log('🤖 测试 Agent + Tools 集成\n');

  // 初始化配置
  const config = ConfigManager.fromEnvironment();
  configStore.getState().setConfig(config);

  console.log('API 配置:');
  console.log('  BASE_URL:', config.baseURL);
  console.log('  MODEL:', config.model);
  console.log('---\n');

  const agent = new Agent();

  // 测试 1: 让 AI 使用 glob 工具找文件
  console.log('📝 测试 1: "帮我找出项目中的所有 TypeScript 文件"');
  console.log('发送请求...\n');
  const response1 = await agent.chat('帮我找出项目中的所有 TypeScript 文件，用 glob 搜索 **/*.ts');
  console.log('AI 回复:\n', response1);
  console.log('\n---\n');

  // 测试 2: 让 AI 使用 shell 工具
  console.log('🔧 测试 2: "运行 git status 看看有什么改动"');
  console.log('发送请求...\n');
  const response2 = await agent.chat('运行 git status 看看当前项目有什么改动');
  console.log('AI 回复:\n', response2);
  console.log('\n---\n');

  // 测试 3: 让 AI 读取文件
  console.log('📄 测试 3: "读取 package.json 的内容"');
  console.log('发送请求...\n');
  const response3 = await agent.chat('读取 package.json 的内容，告诉我项目名称和版本');
  console.log('AI 回复:\n', response3);
}

main().catch((err) => {
  console.error('错误:', err.message);
  process.exit(1);
});
