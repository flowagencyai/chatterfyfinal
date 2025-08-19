import fetch from 'node-fetch';
import { AdapterInput, AdapterOutput, EmbeddingInput, EmbeddingOutput } from '@shared/types';

const OPENAI_API = 'https://api.openai.com/v1';

export const openaiAdapter = {
  async generate(input: AdapterInput): Promise<AdapterOutput> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    const r = await fetch(`${OPENAI_API}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.max_tokens ?? 1024
      })
    });
    if (!r.ok) throw new Error(`OpenAI error: ${r.status} ${await r.text()}`);
    const data = await r.json();
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      raw: data,
      usage: data.usage
    };
  },

  async stream(input: AdapterInput, onDelta: (delta: string, usage?: {prompt_tokens?: number, completion_tokens?: number, total_tokens?: number}) => void): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    const r = await fetch(`${OPENAI_API}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.max_tokens ?? 1024,
        stream: true,
      stream_options: { include_usage: true }
      })
    });
    if (!r.ok || !r.body) throw new Error(`OpenAI stream error: ${r.status} ${await r.text()}`);

    const reader = (r.body as any).getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true,
      stream_options: { include_usage: true } });
      // Process lines beginning with "data: "
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          const usage = json?.usage;
          if (delta) onDelta(delta, usage);
          else if (usage) onDelta('', usage);
        } catch {}
      }
    }
  },

  async embeddings(input: EmbeddingInput): Promise<EmbeddingOutput> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    const r = await fetch(`${OPENAI_API}/embeddings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: input.model,
        input: input.input
      })
    });
    if (!r.ok) throw new Error(`OpenAI error: ${r.status} ${await r.text()}`);
    const data = await r.json();
    const vectors = data.data.map((d:any) => d.embedding);
    return { vectors, raw: data, usage: data.usage };
  }
};
