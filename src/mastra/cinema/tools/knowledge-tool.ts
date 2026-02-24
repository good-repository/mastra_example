import { google } from '@ai-sdk/google';
import { createVectorQueryTool } from '@mastra/rag';

export const cinemaKnowledgeTool = createVectorQueryTool({
  id: 'cinema-knowledge-tool',
  vectorStoreName: 'cinemaKnowledge',
  indexName: 'cinema_faq',
  model: google.embedding('text-embedding-004'),
  description:
    'Search the cinema knowledge base for TV show handling guidelines, TVMaze API reference (endpoints, fields, error handling), response formats, and common scenarios like show not found or ambiguous names.',
});
