export type Price = { input_per_million: number; output_per_million: number };
export type ProviderModel = { provider: 'openai'|'anthropic'|'google'|'ollama', model: string };

// Valores DEFAULT exemplificativos. Em produção, leia de banco/ENV.
// Você pode sobrescrever via ENV: PRICE_OPENAI__gpt_4o_mini__IN, PRICE_OPENAI__gpt_4o_mini__OUT (USD por 1M tokens).
export const DEFAULT_PRICING: Record<string, Price> = {
  // OpenAI
  'openai:gpt-4o-mini': { input_per_million: 0.15, output_per_million: 0.60 },
  'openai:gpt-4o':      { input_per_million: 5.00,  output_per_million: 15.00 },
  'openai:gpt-4.1':     { input_per_million: 10.00, output_per_million: 30.00 },
  // Anthropic (valores ilustrativos)
  'anthropic:claude-3-5-sonnet': { input_per_million: 3.00, output_per_million: 15.00 },
  'anthropic:claude-3-5-haiku':  { input_per_million: 0.80, output_per_million: 4.00 },
  // Google (ilustrativo)
  'google:gemini-1.5-pro':   { input_per_million: 3.50, output_per_million: 10.50 },
  'google:gemini-1.5-flash': { input_per_million: 0.35, output_per_million: 1.05 },
  // Ollama/local (custo variável -> trate como 0 aqui e calcule no seu nó)
  'ollama:llama3.1:8b': { input_per_million: 0, output_per_million: 0 }
};

function key(pm: ProviderModel) { return `${pm.provider}:${pm.model}`; }

function envPrice(provider: string, model: string, kind: 'IN'|'OUT'): number | undefined {
  const envKey = `PRICE_${provider.toUpperCase()}__${model.replace(/[^a-zA-Z0-9]/g,'_')}__${kind}`;
  const raw = process.env[envKey];
  if (!raw) return undefined;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

export function getPrice(provider: ProviderModel['provider'], model: string): Price {
  const k = key({ provider, model });
  const base = DEFAULT_PRICING[k];
  const inOverride = envPrice(provider, model, 'IN');
  const outOverride = envPrice(provider, model, 'OUT');
  if (base) {
    return {
      input_per_million: inOverride ?? base.input_per_million,
      output_per_million: outOverride ?? base.output_per_million
    };
  }
  return {
    input_per_million: inOverride ?? 0,
    output_per_million: outOverride ?? 0
  };
}

export function estimateCostUSD(provider: ProviderModel['provider'], model: string, prompt_tokens?: number|null, completion_tokens?: number|null) {
  const price = getPrice(provider, model);
  const inCost = prompt_tokens ? (prompt_tokens / 1_000_000) * price.input_per_million : 0;
  const outCost = completion_tokens ? (completion_tokens / 1_000_000) * price.output_per_million : 0;
  return { price, inCost, outCost, total: inCost + outCost };
}
