import { Request, Response } from 'express';
import fetch from 'node-fetch';

interface ModelInfo {
  provider: string;
  model: string;
  name: string;
  description: string;
}

async function fetchOpenAIModels(): Promise<ModelInfo[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-...' || apiKey.length < 10) return [];

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) return [];

    const data = await response.json();
    const chatModels = data.data
      .filter((model: any) => 
        model.id.includes('gpt-4') || 
        model.id.includes('gpt-3.5') ||
        model.id === 'gpt-4o' ||
        model.id === 'gpt-4o-mini'
      )
      .map((model: any) => ({
        provider: 'openai',
        model: model.id,
        name: model.id.toUpperCase().replace(/-/g, ' '),
        description: getOpenAIDescription(model.id)
      }))
      .sort((a: ModelInfo, b: ModelInfo) => {
        // Prioritizar modelos mais recentes
        if (a.model.includes('4o')) return -1;
        if (b.model.includes('4o')) return 1;
        if (a.model.includes('4-turbo')) return -1;
        if (b.model.includes('4-turbo')) return 1;
        return 0;
      });

    return chatModels.slice(0, 6); // Limitar para não sobrecarregar a UI
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    return [];
  }
}

async function fetchAnthropicModels(): Promise<ModelInfo[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-...' || apiKey === '...' || apiKey.length < 10) return [];

  // Anthropic não tem endpoint público para listar modelos
  // Retornar modelos conhecidos mais recentes
  return [
    {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Modelo mais avançado da Anthropic'
    },
    {
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      description: 'Rápido e eficiente'
    },
    {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Alta capacidade de raciocínio'
    }
  ];
}

async function fetchDeepSeekModels(): Promise<ModelInfo[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'sk-...' || apiKey.length < 10) return [];

  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      // Se falhar na API, retornar modelos conhecidos
      return [
        {
          provider: 'deepseek',
          model: 'deepseek-chat',
          name: 'DeepSeek Chat',
          description: 'Modelo rápido e eficiente'
        },
        {
          provider: 'deepseek',
          model: 'deepseek-coder',
          name: 'DeepSeek Coder',
          description: 'Especialista em programação'
        }
      ];
    }

    const data = await response.json();
    return data.data
      ?.filter((model: any) => model.id.includes('deepseek'))
      ?.map((model: any) => ({
        provider: 'deepseek',
        model: model.id,
        name: model.id.split('-').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description: getDeepSeekDescription(model.id)
      })) || [];
  } catch (error) {
    console.error('Error fetching DeepSeek models:', error);
    // Fallback para modelos conhecidos
    return [
      {
        provider: 'deepseek',
        model: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: 'Modelo rápido e eficiente'
      },
      {
        provider: 'deepseek',
        model: 'deepseek-coder',
        name: 'DeepSeek Coder',
        description: 'Especialista em programação'
      }
    ];
  }
}

async function fetchGoogleModels(): Promise<ModelInfo[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === '...' || apiKey.length < 10) return [];

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

    if (!response.ok) {
      // Fallback para modelos conhecidos
      return [
        {
          provider: 'google',
          model: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          description: 'Modelo avançado do Google'
        },
        {
          provider: 'google',
          model: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          description: 'Rápido e eficiente'
        }
      ];
    }

    const data = await response.json();
    const chatModels = data.models
      ?.filter((model: any) => 
        model.name.includes('gemini') && 
        model.supportedGenerationMethods?.includes('generateContent')
      )
      ?.map((model: any) => {
        const modelId = model.name.split('/').pop();
        return {
          provider: 'google',
          model: modelId,
          name: modelId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: getGoogleDescription(modelId)
        };
      }) || [];

    return chatModels.slice(0, 4);
  } catch (error) {
    console.error('Error fetching Google models:', error);
    return [
      {
        provider: 'google',
        model: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Modelo avançado do Google'
      },
      {
        provider: 'google',
        model: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Rápido e eficiente'
      }
    ];
  }
}

async function fetchOllamaModels(): Promise<ModelInfo[]> {
  const baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    
    if (!response.ok) return [];

    const data = await response.json();
    return data.models?.map((model: any) => ({
      provider: 'ollama',
      model: model.name,
      name: model.name.charAt(0).toUpperCase() + model.name.slice(1),
      description: `Modelo local (${model.size || 'tamanho desconhecido'})`
    })) || [];
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [];
  }
}

function getOpenAIDescription(modelId: string): string {
  if (modelId.includes('gpt-4o')) return 'Último modelo da OpenAI';
  if (modelId.includes('gpt-4-turbo')) return 'GPT-4 otimizado';
  if (modelId.includes('gpt-4')) return 'Modelo avançado da OpenAI';
  if (modelId.includes('gpt-3.5')) return 'Modelo rápido e eficiente';
  return 'Modelo da OpenAI';
}

function getDeepSeekDescription(modelId: string): string {
  if (modelId.includes('coder')) return 'Especialista em programação';
  if (modelId.includes('chat')) return 'Modelo rápido e eficiente';
  return 'Modelo DeepSeek';
}

function getGoogleDescription(modelId: string): string {
  if (modelId.includes('pro')) return 'Modelo avançado do Google';
  if (modelId.includes('flash')) return 'Rápido e eficiente';
  return 'Modelo Google Gemini';
}

export async function routeModels(req: Request, res: Response) {
  try {
    // Buscar apenas modelos do DeepSeek (único provider com chave válida)
    const deepseekModels = await fetchDeepSeekModels();

    // Cache por 1 hora
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    return res.json({
      models: deepseekModels,
      count: deepseekModels.length,
      providers: {
        deepseek: deepseekModels.length
      }
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return res.status(500).json({ error: 'Failed to fetch models' });
  }
}