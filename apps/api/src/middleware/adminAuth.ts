import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AdminRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

export async function adminAuth(req: AdminRequest, res: Response, next: NextFunction) {
  try {
    // Verificar se há informações básicas de autenticação
    const userEmail = req.headers['x-user-email'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!userEmail && !userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required for admin access'
      });
    }

    // Buscar usuário no banco de dados
    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true }
      });
    } else if (userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, email: true, name: true, role: true }
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Verificar se o usuário tem role de ADMIN
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Anexar informações do usuário admin à requisição
    req.adminUser = user;
    next();

  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error verifying admin permissions'
    });
  }
}