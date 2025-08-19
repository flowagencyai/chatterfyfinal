export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: Role;
  content: any;
}

export interface AdapterInput {
  model: string;
  messages: ChatMessage[];
  provider: 'openai' | 'anthropic' | 'google' | 'ollama';
  temperature?: number;
  max_tokens?: number;
}

export interface AdapterOutput {
  text: string;
  raw?: any;
  usage?: {
    prompt_tokens?: number | null;
    completion_tokens?: number | null;
    total_tokens?: number | null;
  }
}

export interface EmbeddingInput {
  model: string;
  input: string | string[];
  provider: 'openai' | 'google';
}

export interface EmbeddingOutput {
  vectors: number[][];
  raw?: any;
  usage?: any;
}

export interface TenantContext {
  orgId: string;
  userId: string;
}

export interface UsageRecord {
  ts: number;
  provider: 'openai'|'anthropic'|'google'|'ollama';
  model: string;
  orgId: string;
  userId: string;
  prompt_tokens?: number|null;
  completion_tokens?: number|null;
  total_tokens?: number|null;
  cost_usd?: number;
}
