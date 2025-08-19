import { AdapterInput, AdapterOutput, EmbeddingInput, EmbeddingOutput } from '@shared/types';
import { openaiAdapter } from './adapters/openai';
import { anthropicAdapter } from './adapters/anthropic';
import { googleAdapter } from './adapters/google';
import { ollamaAdapter } from './adapters/ollama';
import { deepseekAdapter } from './adapters/deepseek';
export async function generateWithProvider(input: AdapterInput): Promise<AdapterOutput> {
  switch (input.provider) {
    case 'openai': return openaiAdapter.generate(input);
    case 'anthropic': return anthropicAdapter.generate(input);
    case 'google': return googleAdapter.generate(input);
    case 'ollama': return ollamaAdapter.generate(input);
        case 'deepseek': return deepseekAdapter.generate(input);
    default: throw new Error('Unknown provider');
  }
}

export async function embeddingsWithProvider(input: EmbeddingInput): Promise<EmbeddingOutput> {
  switch (input.provider) {
    case 'openai': return openaiAdapter.embeddings(input);
    case 'google': return googleAdapter.embeddings(input);
    default: throw new Error('Provider does not support embeddings or unknown');
  }
}
