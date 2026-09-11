import { Router } from 'express'
import { Types } from 'mongoose'
import { Tortilla } from '../models/Tortilla.js'
import { Puesto } from '../models/Puesto.js'
import { verificarToken, requiereAdmin } from '../middleware/auth.js'

export const tortillasRouter = Router()

// GET /api/tortillas -> lista las activas (público, no requiere login)
tortillasRouter.get('/', async (_req, res) => {
  const tortillas = await Tortilla.find({ activa: true }).sort({ createdAt: -1 })
  res.json(tortillas)
})

// GET /api/tortillas/todas -> lista completa para el panel admin
tortillasRouter.get('/todas', verificarToken, requiereAdmin, async (_req, res) => {
  const tortillas = await Tortilla.find().sort({ createdAt: -1 })
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

// PUT /api/tortillas/:id/puestos/:puestoId -> habilita o deshabilita una tortilla en un puesto
tortillasRouter.put('/:id/puestos/:puestoId', verificarToken, requiereAdmin, async (req, res) => {
  const { habilitada } = req.body
  if (typeof habilitada !== 'boolean') {
    return res.status(400).json({ error: 'Indicá si la tortilla queda habilitada' })
  }

  const puesto = await Puesto.findById(req.params.puestoId)
  if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' })

  const tortilla = await Tortilla.findById(req.params.id)
  if (!tortilla) return res.status(404).json({ error: 'No encontrada' })

  const puestos = await Puesto.find({}, { _id: 1 })
  const idsActuales = tortilla.puestosDisponibles?.map(String) ?? puestos.map((item) => String(item._id))
  const ids = new Set(idsActuales)
  if (habilitada) ids.add(String(puesto._id))
  else ids.delete(String(puesto._id))

  tortilla.puestosDisponibles = [...ids].map((id) => new Types.ObjectId(id))
  await tortilla.save()
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
