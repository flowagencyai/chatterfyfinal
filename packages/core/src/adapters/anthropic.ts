import fetch from 'node-fetch';
import { AdapterInput, AdapterOutput } from '@shared/types';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

export const anthropicAdapter = {
  async generate(input: AdapterInput): Promise<AdapterOutput> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
    // Convert OpenAI-style messages to Anthropic format
    const system = input.messages.find(m => m.role === 'system')?.content ?? undefined;
    const userParts = input.messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    }));

    const r = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: input.model,
        system,
        messages: userParts,
        max_tokens: input.max_tokens ?? 1024,
        temperature: input.temperature ?? 0.2
      })
    });
    if (!r.ok) throw new Error(`Anthropic error: ${r.status} ${await r.text()}`);
    const data = await r.json();
    const text = data?.content?.[0]?.text ?? '';
    return { text, raw: data, usage: data.usage };
  }
};
