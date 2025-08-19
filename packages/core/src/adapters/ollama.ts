import fetch from 'node-fetch';
import { AdapterInput, AdapterOutput } from '@shared/types';

export const ollamaAdapter = {
  async generate(input: AdapterInput): Promise<AdapterOutput> {
    const base = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    const prompt = input.messages.map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n');
    const r = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: input.model, prompt, stream: false })
    });
    if (!r.ok) throw new Error(`Ollama error: ${r.status} ${await r.text()}`);
    const data = await r.json();
    return { text: data?.response ?? '', raw: data };
  }
};
