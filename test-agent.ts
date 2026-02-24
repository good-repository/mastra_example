#!/usr/bin/env node

/**
 * Quick test to verify agent can be called directly
 * Run with: npx ts-node test-agent.ts
 */

import { cinemaAgent } from './src/mastra/cinema/agent';

async function testCinemaAgent() {
  try {
    console.log('Testing cinema agent...');

    const response = await cinemaAgent.stream([
      {
        role: 'user' as const,
        content: 'Me fala sobre Breaking Bad',
      },
    ]);

    if (!response) {
      console.error('No response from agent');
      process.exit(1);
    }

    console.log('First response received, streaming text...');
    let output = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      output += chunk;
    }

    console.log('\n✅ Agent worked! Response length:', output.length);
    process.exit(0);
  } catch (error) {
    console.error('❌ Agent failed:', error);
    process.exit(1);
  }
}

testCinemaAgent();
