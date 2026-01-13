/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      mund: 'active',
      hord: 'active',
      domere: 'active'
    }
  });
});

router.get('/ready', (_req: Request, res: Response) => {
  res.json({ ready: true });
});

router.get('/live', (_req: Request, res: Response) => {
  res.json({ live: true });
});

export { router as healthRoutes };
