import { AdapterInput, AdapterOutput, EmbeddingInput, EmbeddingOutput } from '@shared/types';
import { deepseekAdapter } from './adapters/deepseek';
export async function generateWithProvider(input: AdapterInput): Promise<AdapterOutput> {
  switch (input.provider) {
    case 'deepseek': return deepseekAdapter.generate(input);
    default: throw new Error('Unknown provider');
  }
}

export async function embeddingsWithProvider(input: EmbeddingInput): Promise<EmbeddingOutput> {
  throw new Error('Embeddings not supported with current providers');
}
