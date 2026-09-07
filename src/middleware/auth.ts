import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export interface TokenPayload {
  id: string
  rol: 'cliente' | 'admin'
}

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload
    }
  }
}

export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Falta el token de autenticación' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
    req.usuario = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o vencido' })
  }
}

export function requiereAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'No tenés permisos de administrador' })
  }
  next()
}
