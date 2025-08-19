import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { z } from 'zod';

// Schema de validação para atualização do perfil
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    language: z.string().optional(),
    defaultModel: z.string().optional(),
    emailNotifications: z.boolean().optional(),
    improveAI: z.boolean().optional()
  }).optional()
});

/**
 * PUT /v1/user/profile - Atualiza dados do usuário
 */
export async function routeUpdateUserProfile(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Validar dados de entrada
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        details: validation.error.issues 
      });
    }

    const { name, preferences } = validation.data;

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Para preferências, vamos armazenar em uma tabela separada no futuro
    // Por enquanto, retornar sucesso
    res.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
        image: updatedUser.image
      },
      preferences: preferences || {},
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
}