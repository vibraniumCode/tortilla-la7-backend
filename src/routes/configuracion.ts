import { Router } from 'express'
import { Configuracion } from '../models/Configuracion.js'
import { verificarToken, requiereAdmin } from '../middleware/auth.js'

export const configuracionRouter = Router()

// GET /api/configuracion -> público (el checkout necesita mostrar el alias)
configuracionRouter.get('/', async (_req, res) => {
  let config = await Configuracion.findOne()
  if (!config) {
    config = await Configuracion.create({ aliasTransferencia: '' })
  }
  res.json(config)
})

// PUT /api/configuracion -> editar (solo admin)
configuracionRouter.put('/', verificarToken, requiereAdmin, async (req, res) => {
  let config = await Configuracion.findOne()
  if (!config) {
    config = await Configuracion.create(req.body)
  } else {
    config.set(req.body)
    await config.save()
  }
  res.json(config)
})
