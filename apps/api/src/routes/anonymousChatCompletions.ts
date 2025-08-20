import { Request, Response } from 'express';
import { generateWithProvider } from '../../../../packages/core/src/generate.js';
import { deepseekAdapter } from '@core/adapters/deepseek';

/**
 * Route handler for anonymous chat completions.
 * Uses limited functionality without database dependencies.
 */
export async function routeAnonymousChatCompletions(req: Request, res: Response) {
  try {
    const { model, messages, provider = 'deepseek', stream = false, temperature, max_tokens } = req.body;
    
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing required fields: model, messages' });
    }

    // Limit anonymous requests
    if (messages.length > 10) {
      return res.status(429).json({ 
        error: 'Too many messages. Please sign up for unlimited access.',
        code: 'ANONYMOUS_LIMIT_EXCEEDED'
      });
    }

    // Create request object for core generate function
    const generateRequest = {
      model,
      messages,
      provider,
      stream,
      temperature,
      max_tokens: Math.min(max_tokens || 500, 500) // Limit tokens for anonymous
    };

    if (stream && provider === 'deepseek') {
      // Handle streaming response with real streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      
      let closed = false;
      req.on('close', () => { closed = true; });
      
      const ping = setInterval(() => {
        if (closed) return;
        res.write(`event: ping\n`);
        res.write(`data: ""\n\n`);
      }, 15000);
      
      try {
        // Usar apenas o adapter do DeepSeek
        await deepseekAdapter.stream(generateRequest, (delta, usage) => {
          if (closed) return;
          if (delta) {
            res.write(`event: token\n`);
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
        });
        
        if (!closed) {
          res.write(`event: done\n`);
          res.write(`data: "ok"\n\n`);
        }
      } catch (e: any) {
        if (!closed) {
          res.write(`event: error\n`);
          res.write(`data: ${JSON.stringify({ message: e?.message || 'stream error' })}\n\n`);
        }
      } finally {
        clearInterval(ping);
        if (!closed) res.end();
      }
    } else {
      // Call the generate function from core package for non-streaming
      const result = await generateWithProvider(generateRequest);
      // Return standard OpenAI-compatible response
      res.json(result);
    }
  } catch (error: any) {
    console.error('Anonymous chat completion error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}