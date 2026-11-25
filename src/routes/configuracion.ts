import { Router } from 'express'
import { Configuracion, type IConfiguracion } from '../models/Configuracion.js'
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
  try {
    const cambios: Partial<IConfiguracion> = {}
    const camposTexto = ['aliasTransferencia', 'cbu', 'titular'] as const

    if (typeof req.body?.whatsapp === 'string') {
      const whatsapp = req.body.whatsapp.replace(/\D/g, '')
      if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 15)) {
        return res.status(400).json({
          error: 'Ingresá un WhatsApp internacional válido, con 10 a 15 dígitos.',
        })
      }
      cambios.whatsapp = whatsapp
    }

    for (const campo of camposTexto) {
      if (typeof req.body?.[campo] === 'string') {
        cambios[campo] = req.body[campo].trim()
      }
    }

    const config = await Configuracion.findOneAndUpdate(
      {},
      { $set: cambios },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )
    return res.json(config)
  } catch (err) {
    console.error('No se pudo guardar la configuración:', err)
    return res.status(500).json({ error: 'No se pudo guardar la configuración.' })
  }
})
