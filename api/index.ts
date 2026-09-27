import type { Request, Response } from 'express';
import app from '../server';

export default function handler(req: Request, res: Response) {
  const url = new URL(req.url || '/', 'http://localhost');
  const route = url.searchParams.get('route');
  if (route) {
    url.searchParams.delete('route');
    req.url = `/${route}${url.search}`;
  }
  return app(req, res);
}
