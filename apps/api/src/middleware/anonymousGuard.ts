import { Request, Response, NextFunction } from 'express';

export async function anonymousGuard(req: Request, res: Response, next: NextFunction) {
  const t = (req as any).tenant || {};
  
  // Check if it's an anonymous session
  if (t.orgId === 'anonymous') {
    // Set anonymous limits
    (req as any).anonymousLimits = {
      maxMessages: 3,
      maxTokens: 1000,
      rateLimitPerMinute: 5
    };
    
    // Skip plan checking for anonymous users
    (req as any).plan = {
      dailyTokenLimit: 1000,
      storageLimitMB: 0, // No file uploads for anonymous
      name: 'Anonymous'
    };
  }
  
  next();
}