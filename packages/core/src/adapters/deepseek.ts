import fetch from 'node-fetch';
import { AdapterInput, AdapterOutput, EmbeddingInput, EmbeddingOutput } from '@shared/types';

const DEEPSEEK_API = 'https://api.deepseek.com/v1';

export const deepseekAdapter = {
  async generate(input: AdapterInput): Promise<AdapterOutput> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set');
    
    const r = await fetch(`${DEEPSEEK_API}/chat/completions`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: input.model || 'deepseek-chat', // Default model
        messages: input.messages,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.max_tokens ?? 1024,
        stream: false
      })
    });

    if (!r.ok) {
      const errorText = await r.text();
      throw new Error(`DeepSeek API error: ${r.status} ${errorText}`);
    }

    const data = await r.json();
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      raw: data,
      usage: data.usage,
      choices: data.choices
    };
  },

  async stream(input: AdapterInput, onDelta: (delta: string, usage?: {prompt_tokens?: number, completion_tokens?: number, total_tokens?: number}) => void): Promise<void> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set');
    
    const r = await fetch(`${DEEPSEEK_API}/chat/completions`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: input.model || 'deepseek-chat',
        messages: input.messages,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.max_tokens ?? 1024,
        stream: true
      })
    });

    if (!r.ok || !r.body) {
      const errorText = await r.text();
      throw new Error(`DeepSeek stream error: ${r.status} ${errorText}`);
    }

    const reader = (r.body as any).getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
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
        } catch (error) {
          console.error('Error parsing DeepSeek stream data:', error);
        }
      }
    }
  },

  async embeddings(input: EmbeddingInput): Promise<EmbeddingOutput> {
    throw new Error('DeepSeek embeddings not supported yet');
  }
};