import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { randomBytes } from 'crypto';

/**
 * POST /v1/user/regenerate-api-key - Regenera API Key existente
 */
export async function routeRegenerateApiKey(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Buscar organização
    const organization = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!organization.apiKey) {
      return res.status(400).json({ 
        error: 'No API key exists for this organization. Please generate one first.' 
      });
    }

    // Gerar nova API key
    const newApiKey = 'sk-' + randomBytes(24).toString('hex');
    
    // Atualizar organização com nova API key
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        apiKey: newApiKey,
        apiKeyCreatedAt: new Date()
      }
    });

    // Retornar nova key (apenas nesta resposta)
    res.json({
      success: true,
      apiKey: updatedOrg.apiKey,
      preview: `${updatedOrg.apiKey?.substring(0, 12)}...`,
      createdAt: updatedOrg.apiKeyCreatedAt,
      message: 'API key regenerated successfully. Previous key has been revoked.'
    });

  } catch (error) {
    console.error('Error regenerating API key:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate API key',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}