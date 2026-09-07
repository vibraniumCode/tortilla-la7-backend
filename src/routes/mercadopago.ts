import { Router } from 'express'
import { Pedido } from '../models/Pedido.js'

export const mercadopagoRouter = Router()

function tokenConfigurado() {
  return !!process.env.MP_ACCESS_TOKEN
}

// POST /api/mercadopago/preferencia -> crea una preferencia de pago para un pedido
// ya creado, y devuelve la URL de pago (init_point) para redirigir al cliente.
mercadopagoRouter.post('/preferencia', async (req, res) => {
  if (!tokenConfigurado()) {
    return res.status(501).json({
      error: 'Mercado Pago no está configurado todavía (falta MP_ACCESS_TOKEN en el .env)',
    })
  }

  try {
    const { pedidoId } = req.body
    const pedido = await Pedido.findById(pedidoId)
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' })

    const items = pedido.items.map((i) => ({
      title: i.nombre,
      quantity: i.cantidad,
      unit_price: i.precio,
      currency_id: 'ARS',
    }))

    if (pedido.costoEnvio > 0) {
      items.push({
        title: 'Envío',
        quantity: 1,
        unit_price: pedido.costoEnvio,
        currency_id: 'ARS',
      })
    }

    const respuesta = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        external_reference: String(pedido._id),
        notification_url: process.env.MP_WEBHOOK_URL, // tiene que ser una URL pública
        back_urls: {
          success: process.env.MP_BACK_URL_SUCCESS,
          failure: process.env.MP_BACK_URL_FAILURE,
        },
      }),
    })

    const data = await respuesta.json()
    if (!respuesta.ok) {
      return res.status(502).json({ error: 'Mercado Pago rechazó la solicitud', detalle: data })
    }

    res.json({ initPoint: data.init_point })
  } catch (err) {
    res.status(500).json({ error: 'No se pudo crear la preferencia de pago', detalle: err })
  }
})

// POST /api/mercadopago/webhook -> Mercado Pago llama acá cuando cambia el estado de un pago.
// Requiere que MP_WEBHOOK_URL sea una URL pública (no funciona con localhost).
mercadopagoRouter.post('/webhook', async (req, res) => {
  if (!tokenConfigurado()) {
    return res.status(501).json({ error: 'Mercado Pago no está configurado todavía' })
  }

  try {
    const paymentId = req.query['data.id'] ?? req.body?.data?.id
    if (!paymentId) return res.sendStatus(200)

    const respuesta = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })
    const pago = await respuesta.json()

    if (pago.status === 'approved' && pago.external_reference) {
      await Pedido.findByIdAndUpdate(pago.external_reference, { pagoConfirmado: true })
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Error en webhook de Mercado Pago:', err)
    res.sendStatus(200) // siempre 200, si no Mercado Pago reintenta sin parar
  }
})
