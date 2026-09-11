import { Router } from 'express'
import { Zona } from '../models/Zona.js'
import { verificarToken, requiereAdmin } from '../middleware/auth.js'

export const zonasRouter = Router()

// GET /api/zonas -> lista las activas (público)
zonasRouter.get('/', async (_req, res) => {
  const zonas = await Zona.find({ activa: true }).sort({ nombre: 1 })
  res.json(zonas)
})

// POST /api/zonas -> crear zona nueva (solo admin)
zonasRouter.post('/', verificarToken, requiereAdmin, async (req, res) => {
  try {
    const zona = await Zona.create(req.body)
    res.status(201).json(zona)
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear la zona', detalle: err })
  }
})

// PUT /api/zonas/:id -> editar costo de envío (solo admin)
zonasRouter.put('/:id', verificarToken, requiereAdmin, async (req, res) => {
  const zona = await Zona.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!zona) return res.status(404).json({ error: 'No encontrada' })
  res.json(zona)
})

// DELETE /api/zonas/:id -> baja lógica para conservar pedidos históricos
zonasRouter.delete('/:id', verificarToken, requiereAdmin, async (req, res) => {
  const zona = await Zona.findByIdAndUpdate(req.params.id, { activa: false }, { new: true })
  if (!zona) return res.status(404).json({ error: 'No encontrada' })
  res.json({ ok: true })
})
