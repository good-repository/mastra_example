/**
 * Cinema Knowledge Base — Seed Script
 *
 * Chunks faq.md, generates Google embeddings, and upserts into LibSQL vector store.
 * Run once (or after updating faq.md):
 *
 *   yarn seed:cinema
 */

import { google } from '@ai-sdk/google';
import { LibSQLVector } from '@mastra/libsql';
import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INDEX_NAME = 'cinema_faq';
const EMBEDDING_DIMENSION = 768; // text-embedding-004 default dimension
const VECTOR_STORE_URL = 'file:./mastra.db';

async function seed() {
  console.log('[seed] Reading faq.md...');
  const content = readFileSync(join(__dirname, 'faq.md'), 'utf-8');

  console.log('[seed] Chunking document...');
  const doc = MDocument.fromMarkdown(content);
  const chunks = await doc.chunk({ strategy: 'recursive', maxSize: 512, overlap: 50 });
  console.log(`[seed] ${chunks.length} chunks created`);

  console.log('[seed] Generating embeddings...');
  const { embeddings } = await embedMany({
    model: google.embedding('text-embedding-004'),
    values: chunks.map((c) => c.text),
  });

  const store = new LibSQLVector({ id: 'cinema-knowledge-seed', url: VECTOR_STORE_URL });

  try {
    await store.createIndex({ indexName: INDEX_NAME, dimension: EMBEDDING_DIMENSION });
    console.log(`[seed] Index "${INDEX_NAME}" created`);
  } catch {
    console.log(`[seed] Index "${INDEX_NAME}" already exists, skipping`);
  }

  await store.upsert({
    indexName: INDEX_NAME,
    vectors: embeddings,
    metadata: chunks.map((c) => ({ text: c.text })),
  });

  console.log(`[seed] Done — ${chunks.length} chunks indexed into "${INDEX_NAME}"`);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
