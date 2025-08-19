import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { randomBytes } from 'crypto';

/**
 * POST /v1/user/generate-api-key - Gera nova API Key para organização
 */
export async function routeGenerateApiKey(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { permissions = [] } = req.body;
    
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

    // Gerar nova API key
    const apiKey = 'sk-' + randomBytes(24).toString('hex');
    
    // Atualizar organização com nova API key
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        apiKey: apiKey,
        apiKeyCreatedAt: new Date()
      }
    });

    // Retornar key (apenas nesta resposta)
    res.json({
      success: true,
      apiKey: updatedOrg.apiKey,
      preview: `${updatedOrg.apiKey?.substring(0, 12)}...`,
      createdAt: updatedOrg.apiKeyCreatedAt,
      permissions: permissions
    });

  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ 
      error: 'Failed to generate API key',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}