import fetch from 'node-fetch';
import { AdapterInput, AdapterOutput, EmbeddingInput, EmbeddingOutput } from '@shared/types';

export const googleAdapter = {
  async generate(input: AdapterInput): Promise<AdapterOutput> {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error('GOOGLE_API_KEY not set');
    // Using Gemini REST (v1beta) - text-only basic sample
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${key}`;
    const parts = input.messages.map(m => ({ role: m.role, parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }] }));
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: parts, generationConfig: { temperature: input.temperature ?? 0.2 } })
    });
    if (!r.ok) throw new Error(`Google error: ${r.status} ${await r.text()}`);
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { text, raw: data };
  },
  async embeddings(input: EmbeddingInput): Promise<EmbeddingOutput> {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error('GOOGLE_API_KEY not set');
    const model = input.model; // e.g., text-embedding-004
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${key}`;
    const inputs = Array.isArray(input.input) ? input.input : [input.input];
    const vectors = [];
    for (const txt of inputs) {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: txt }] } })
      });
      if (!r.ok) throw new Error(`Google embed error: ${r.status} ${await r.text()}`);
      const data = await r.json();
      vectors.push(data?.embedding?.values || []);
    }
    return { vectors, raw: null };
  }
};
