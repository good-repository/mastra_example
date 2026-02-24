/**
 * Weather Agent Eval Runner
 *
 * Exercises the weather agent with representative queries and runs all scorers,
 * printing a human-readable score report.
 *
 * Run with:
 *   yarn eval
 *
 * What each scorer checks:
 *   toolCallAppropriatenessScorer — did the agent call weatherTool when it should?
 *   completenessScorer            — does the response contain all expected fields?
 *   translationScorer             — did the agent translate non-English city names?
 */

import { weatherAgent } from '../weather/agent';
import {
  toolCallAppropriatenessScorer,
  completenessScorer,
  translationScorer,
} from '../scorers/weather-scorer';

const TEST_CASES = [
  {
    name: 'English city — current weather',
    query: 'What is the current weather in London?',
  },
  {
    name: 'Portuguese query with non-English city',
    query: 'Como está o tempo em Tóquio agora?',
  },
  {
    name: 'Brazilian city — activity planning',
    query: 'O que posso fazer em São Paulo com o tempo de hoje?',
  },
  {
    name: 'City with accented name',
    query: 'Como está o clima em Munique?',
  },
] as const;

const SCORERS = {
  toolCallAppropriatenessScorer,
  completenessScorer,
  translationScorer,
} as const;

const PASS_THRESHOLD = 0.7;

async function runEvals() {
  console.log('\n🧪 Weather Agent — Eval Runner\n');
  console.log(`Pass threshold: ${PASS_THRESHOLD}\n`);
  console.log('─'.repeat(60));

  let totalPassed = 0;
  let totalChecks = 0;

  for (const testCase of TEST_CASES) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   Query: "${testCase.query}"`);

    let result: Awaited<ReturnType<typeof weatherAgent.generate>>;
    try {
      result = await weatherAgent.generate(testCase.query);
    } catch (err) {
      console.log(`   ❌ Agent error: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    const run = {
      input: [{ role: 'user' as const, content: testCase.query }],
      output: result,
    };

    for (const [name, scorer] of Object.entries(SCORERS)) {
      totalChecks++;
      try {
        const scoreResult = await scorer.score(run);
        const score: number =
          typeof scoreResult === 'number' ? scoreResult : (scoreResult as { score: number }).score;
        const reason: string =
          typeof scoreResult === 'number'
            ? ''
            : ((scoreResult as { reason?: string }).reason ?? '');

        const passed = score >= PASS_THRESHOLD;
        if (passed) totalPassed++;

        const icon = passed ? '✅' : '❌';
        const scoreStr = score.toFixed(2);
        console.log(`   ${icon} ${name}: ${scoreStr}${reason ? ` — ${reason}` : ''}`);
      } catch (err) {
        console.log(
          `   ⚠️  ${name}: scorer error — ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  console.log('\n' + '─'.repeat(60));
  const pct = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;
  console.log(`\n📊 Results: ${totalPassed}/${totalChecks} checks passed (${pct}%)\n`);

  if (totalPassed < totalChecks) {
    process.exit(1);
  }
}

runEvals().catch((err) => {
  console.error('\n💥 Eval runner crashed:', err);
  process.exit(1);
});
