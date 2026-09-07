import { Router } from 'express'
import { Tortilla } from '../models/Tortilla.js'
import { verificarToken, requiereAdmin } from '../middleware/auth.js'

export const tortillasRouter = Router()

// GET /api/tortillas -> lista las activas (público, no requiere login)
tortillasRouter.get('/', async (_req, res) => {
  const tortillas = await Tortilla.find({ activa: true }).sort({ createdAt: -1 })
  res.json(tortillas)
})

// POST /api/tortillas -> crear una nueva (solo admin)
tortillasRouter.post('/', verificarToken, requiereAdmin, async (req, res) => {
  try {
    const tortilla = await Tortilla.create(req.body)
    res.status(201).json(tortilla)
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear la tortilla', detalle: err })
  }
})

// PUT /api/tortillas/:id -> editar (solo admin)
tortillasRouter.put('/:id', verificarToken, requiereAdmin, async (req, res) => {
  const tortilla = await Tortilla.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  })
  if (!tortilla) return res.status(404).json({ error: 'No encontrada' })
  res.json(tortilla)
})

// DELETE /api/tortillas/:id -> baja lógica (solo admin)
tortillasRouter.delete('/:id', verificarToken, requiereAdmin, async (req, res) => {
  const tortilla = await Tortilla.findByIdAndUpdate(
    req.params.id,
    { activa: false },
    { new: true },
  )
  if (!tortilla) return res.status(404).json({ error: 'No encontrada' })
  res.json({ ok: true })
})
