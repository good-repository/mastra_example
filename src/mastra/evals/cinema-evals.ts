/**
 * Cinema Agent Eval Runner
 *
 * Exercises the cinema agent with representative queries and runs all scorers,
 * printing a human-readable score report.
 *
 * Run with:
 *   yarn eval:cinema
 *
 * What each scorer checks:
 *   toolSelectionScorer    — did the agent prefer cinema-direct-tool for basic show info?
 *   responseFormatScorer   — does the response include all 5 required markdown fields?
 *   htmlStrippingScorer    — were HTML tags from TVMaze summaries stripped from the response?
 */

import { cinemaAgent } from '../cinema/agent';
import {
  toolSelectionScorer,
  responseFormatScorer,
  htmlStrippingScorer,
} from '../scorers/cinema-scorer';

const TEST_CASES = [
  {
    name: 'Popular EN show — general info',
    query: 'Me conta sobre Breaking Bad',
  },
  {
    name: 'Non-English show — English search term required',
    query: 'Quais informações você tem sobre Dark?',
  },
  {
    name: 'Show with HTML-heavy summary',
    query: 'Me fala sobre Stranger Things',
  },
  {
    name: 'English query — general show info',
    query: 'What can you tell me about Game of Thrones?',
  },
] as const;

const SCORERS = {
  toolSelectionScorer,
  responseFormatScorer,
  htmlStrippingScorer,
} as const;

const PASS_THRESHOLD = 0.7;

async function runEvals() {
  console.log('\n🎬 Cinema Agent — Eval Runner\n');
  console.log(`Pass threshold: ${PASS_THRESHOLD}\n`);
  console.log('─'.repeat(60));

  let totalPassed = 0;
  let totalChecks = 0;

  for (const testCase of TEST_CASES) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   Query: "${testCase.query}"`);

    let result: Awaited<ReturnType<typeof cinemaAgent.generate>>;
    try {
      result = await cinemaAgent.generate(testCase.query);
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
          `   ⚠️  ${name}: scorer error — ${err instanceof Error ? err.message : String(err)}`,
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
