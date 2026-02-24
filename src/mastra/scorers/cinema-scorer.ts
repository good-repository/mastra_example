import { z } from 'zod';
import { createToolCallAccuracyScorerCode } from '@mastra/evals/scorers/prebuilt';
import {
  getAssistantMessageFromRunOutput,
  getUserMessageFromRunInput,
} from '@mastra/evals/scorers/utils';
import { createScorer } from '@mastra/core/evals';

type FormatAnalysis = {
  presentFields?: string[];
  missingFields?: string[];
};

type HtmlAnalysis = {
  hasHtml?: boolean;
  examples?: string[];
  explanation?: string;
};

const REQUIRED_FIELDS = [
  '**Série:**',
  '**Status:**',
  '**Gênero:**',
  '**Sinopse:**',
  '**Disponível em:**',
];

// Checks if cinema-direct-tool was preferred for basic show info queries
export const toolSelectionScorer = createToolCallAccuracyScorerCode({
  expectedTool: 'cinema-direct-tool',
  strictMode: false,
});

// Checks if the response includes all 5 required cinema format fields
export const responseFormatScorer = createScorer({
  id: 'response-format-scorer',
  name: 'Response Format',
  description:
    'Checks that the cinema agent response includes all required markdown fields: Série, Status, Gênero, Sinopse, Disponível em',
  type: 'agent',
  judge: {
    model: 'google/gemini-2.5-flash-lite',
    instructions:
      'You are an evaluator checking whether a TV show assistant response follows a required markdown format. ' +
      'Identify which of the 5 required fields are present or missing. Return only the structured JSON.',
  },
})
  .preprocess(({ run }) => {
    const assistantText = getAssistantMessageFromRunOutput(run.output) ?? '';
    return { assistantText };
  })
  .analyze({
    description: 'Check which required format fields are present in the response',
    outputSchema: z.object({
      presentFields: z.array(z.string()).default([]),
      missingFields: z.array(z.string()).default([]),
    }),
    createPrompt: ({ results }) => `
You are checking if a cinema assistant response includes all 5 required markdown fields.

Required fields (exact text):
${REQUIRED_FIELDS.map(f => `- ${f}`).join('\n')}

Assistant response:
"""
${results.preprocessStepResult.assistantText}
"""

Check which fields are present and which are missing. A field is present if its exact label (e.g. "**Série:**") appears in the response.
Return JSON:
{
  "presentFields": ["list of found fields"],
  "missingFields": ["list of missing fields"]
}
    `,
  })
  .generateScore(({ results }) => {
    const r = (results?.analyzeStepResult as FormatAnalysis) ?? {};
    const present = r.presentFields ?? [];
    return present.length / REQUIRED_FIELDS.length;
  })
  .generateReason(({ results, score }) => {
    const r = (results?.analyzeStepResult as FormatAnalysis) ?? {};
    const missing = r.missingFields ?? [];
    if (missing.length === 0) return `All ${REQUIRED_FIELDS.length} required fields present. Score=${score}`;
    return `Missing fields: ${missing.join(', ')}. Score=${score}`;
  });

// Checks that HTML tags from TVMaze summaries were stripped from the response
export const htmlStrippingScorer = createScorer({
  id: 'html-stripping-scorer',
  name: 'HTML Stripping',
  description:
    'Checks that HTML tags (e.g. <p>, <b>, <i>) from TVMaze summaries were removed from the agent response',
  type: 'agent',
  judge: {
    model: 'google/gemini-2.5-flash-lite',
    instructions:
      'You are an evaluator checking whether a text response contains raw HTML tags. ' +
      'Look for tags like <p>, </p>, <b>, <i>, <em>, <strong>, <br>. Return only the structured JSON.',
  },
})
  .preprocess(({ run }) => {
    const userText = getUserMessageFromRunInput(run.input) ?? '';
    const assistantText = getAssistantMessageFromRunOutput(run.output) ?? '';
    return { userText, assistantText };
  })
  .analyze({
    description: 'Detect HTML tags in the assistant response',
    outputSchema: z.object({
      hasHtml: z.boolean(),
      examples: z.array(z.string()).default([]),
      explanation: z.string().default(''),
    }),
    createPrompt: ({ results }) => `
You are checking if a TV show assistant response contains raw HTML tags that should have been stripped.

Assistant response:
"""
${results.preprocessStepResult.assistantText}
"""

Check if the response contains any raw HTML tags such as <p>, </p>, <b>, <i>, <em>, <strong>, <br>, or similar.
Return JSON:
{
  "hasHtml": boolean,
  "examples": ["list of up to 3 HTML tags found, or empty array"],
  "explanation": "brief explanation"
}
    `,
  })
  .generateScore(({ results }) => {
    const r = (results?.analyzeStepResult as HtmlAnalysis) ?? {};
    return r.hasHtml ? 0 : 1;
  })
  .generateReason(({ results, score }) => {
    const r = (results?.analyzeStepResult as HtmlAnalysis) ?? {};
    if (score === 1) return `No HTML tags found. ${r.explanation ?? ''}`;
    const examples = (r.examples ?? []).join(', ');
    return `HTML tags detected${examples ? ': ' + examples : ''}. ${r.explanation ?? ''}`;
  });

export const scorers = {
  toolSelectionScorer: { scorer: toolSelectionScorer },
  responseFormatScorer: { scorer: responseFormatScorer },
  htmlStrippingScorer: { scorer: htmlStrippingScorer },
};
