import { Router } from 'express'
import { verificarToken } from '../middleware/auth.js'
import {
  clavePublicaNotificaciones,
  guardarSuscripcion,
  notificacionesConfiguradas,
} from '../notificaciones.js'

export const notificacionesRouter = Router()

notificacionesRouter.get('/clave-publica', (_req, res) => {
  res.json({ configurada: notificacionesConfiguradas(), clave: clavePublicaNotificaciones() })
})

notificacionesRouter.post('/suscripcion', verificarToken, async (req, res) => {
  const { endpoint, expirationTime, keys } = req.body
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Suscripcion de notificaciones invalida' })
  }

  await guardarSuscripcion(req.usuario!.id, { endpoint, expirationTime, keys })
  res.status(204).send()
})
