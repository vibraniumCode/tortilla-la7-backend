import { Router } from 'express'
import { Puesto } from '../models/Puesto.js'
import { verificarToken, requiereAdmin } from '../middleware/auth.js'

export const puestosRouter = Router()

// GET /api/puestos -> lista los activos (público)
puestosRouter.get('/', async (_req, res) => {
  const puestos = await Puesto.find({ activo: true }).sort({ nombre: 1 })
  res.json(puestos)
})

// POST /api/puestos -> crear uno nuevo (solo admin)
puestosRouter.post('/', verificarToken, requiereAdmin, async (req, res) => {
  try {
    const puesto = await Puesto.create(req.body)
    res.status(201).json(puesto)
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el puesto', detalle: err })
  }
})

// PUT /api/puestos/:id -> editar (solo admin)
puestosRouter.put('/:id', verificarToken, requiereAdmin, async (req, res) => {
  const puesto = await Puesto.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!puesto) return res.status(404).json({ error: 'No encontrado' })
  res.json(puesto)
})

// DELETE /api/puestos/:id -> baja lógica (solo admin)
puestosRouter.delete('/:id', verificarToken, requiereAdmin, async (req, res) => {
  const puesto = await Puesto.findByIdAndUpdate(
    req.params.id,
    { activo: false },
    { new: true },
  )
  if (!puesto) return res.status(404).json({ error: 'No encontrado' })
  res.json({ ok: true })
})
