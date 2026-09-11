import { Router } from 'express'
import { Novedad } from '../models/Novedad.js'
import { verificarToken, requiereAdmin } from '../middleware/auth.js'

export const novedadesRouter = Router()

// GET /api/novedades -> lista las activas, ordenadas (público)
novedadesRouter.get('/', async (_req, res) => {
  const novedades = await Novedad.find({ activa: true }).sort({ orden: 1 })
  res.json(novedades)
})

// GET /api/novedades/todas -> lista todas, incluidas inactivas (solo admin)
novedadesRouter.get('/todas', verificarToken, requiereAdmin, async (_req, res) => {
  const novedades = await Novedad.find().sort({ orden: 1 })
  res.json(novedades)
})

// POST /api/novedades -> crear (solo admin)
novedadesRouter.post('/', verificarToken, requiereAdmin, async (req, res) => {
  try {
    const novedad = await Novedad.create(req.body)
    res.status(201).json(novedad)
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear la novedad', detalle: err })
  }
})

// PUT /api/novedades/:id -> editar (solo admin)
novedadesRouter.put('/:id', verificarToken, requiereAdmin, async (req, res) => {
  const novedad = await Novedad.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!novedad) return res.status(404).json({ error: 'No encontrada' })
  res.json(novedad)
})

// DELETE /api/novedades/:id -> elimina definitivamente (solo admin)
novedadesRouter.delete('/:id', verificarToken, requiereAdmin, async (req, res) => {
  const novedad = await Novedad.findByIdAndDelete(req.params.id)
  if (!novedad) return res.status(404).json({ error: 'No encontrada' })
  res.json({ ok: true })
})
