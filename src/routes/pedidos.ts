import { Router } from 'express'
import { Pedido } from '../models/Pedido.js'
import { Zona } from '../models/Zona.js'
import { Puesto } from '../models/Puesto.js'
import { Usuario } from '../models/Usuario.js'
import { Tortilla } from '../models/Tortilla.js'
import { verificarToken, requiereAdmin } from '../middleware/auth.js'
import { subirArchivo, upload } from './uploads.js'
import { notificarAdmins, notificarUsuario } from '../notificaciones.js'

export const pedidosRouter = Router()

// GET /api/pedidos -> lista todos (solo admin, más nuevos primero)
pedidosRouter.get('/', verificarToken, requiereAdmin, async (_req, res) => {
  const pedidos = await Pedido.find()
    .populate('zona')
    .populate('puesto')
    .populate('cliente', 'nombre email telefono')
    .sort({ createdAt: -1 })
  res.json(pedidos)
})

// GET /api/pedidos/estadisticas -> ingresos y ventas agregadas (solo admin)
// OJO: esta ruta va ANTES de /:id para que Express no confunda "estadisticas" con un id.
pedidosRouter.get('/estadisticas', verificarToken, requiereAdmin, async (_req, res) => {
  const pedidos = await Pedido.find({ estado: { $ne: 'cancelado' } })
    .populate('zona')
    .populate('puesto')
    .sort({ createdAt: -1 })

  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const hace7dias = new Date(inicioHoy.getTime() - 6 * 24 * 60 * 60 * 1000)
  const hace30dias = new Date(inicioHoy.getTime() - 29 * 24 * 60 * 60 * 1000)
  const hace14dias = new Date(inicioHoy.getTime() - 13 * 24 * 60 * 60 * 1000)

  let hoy = 0
  let semana = 0
  let mes = 0

  const porDiaMap = new Map<string, number>()
  const porZonaMap = new Map<string, { total: number; pedidos: number }>()
  const porPuestoMap = new Map<string, { total: number; pedidos: number }>()
  const porTortillaMap = new Map<string, { cantidad: number; total: number }>()
  let cantidadEnvios = 0
  let cantidadRetiros = 0

  for (const p of pedidos) {
    const fecha = new Date((p as any).createdAt)

    if (fecha >= inicioHoy) hoy += p.total
    if (fecha >= hace7dias) semana += p.total
    if (fecha >= hace30dias) mes += p.total

    if (fecha >= hace14dias) {
      const clave = fecha.toISOString().slice(0, 10)
      porDiaMap.set(clave, (porDiaMap.get(clave) ?? 0) + p.total)
    }

    if (p.entrega === 'envio') {
      cantidadEnvios++
      const zona = p.zona as any
      const nombre = zona?.nombre ?? 'Sin zona'
      const actual = porZonaMap.get(nombre) ?? { total: 0, pedidos: 0 }
      actual.total += p.total
      actual.pedidos += 1
      porZonaMap.set(nombre, actual)
    } else {
      cantidadRetiros++
      const puesto = p.puesto as any
      const nombre = puesto?.nombre ?? 'Sin puesto'
      const actual = porPuestoMap.get(nombre) ?? { total: 0, pedidos: 0 }
      actual.total += p.total
      actual.pedidos += 1
      porPuestoMap.set(nombre, actual)
    }

    for (const item of p.items) {
      const actual = porTortillaMap.get(item.nombre) ?? { cantidad: 0, total: 0 }
      actual.cantidad += item.cantidad
      actual.total += item.precio * item.cantidad
      porTortillaMap.set(item.nombre, actual)
    }
  }

  // Completa los 14 días aunque no haya ventas, para que el gráfico no tenga huecos
  const porDia: { fecha: string; total: number }[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(hace14dias.getTime() + i * 24 * 60 * 60 * 1000)
    const clave = d.toISOString().slice(0, 10)
    porDia.push({ fecha: clave, total: porDiaMap.get(clave) ?? 0 })
  }

  res.json({
    hoy,
    semana,
    mes,
    porDia,
    porZona: [...porZonaMap.entries()].map(([nombre, v]) => ({ nombre, ...v })),
    porPuesto: [...porPuestoMap.entries()].map(([nombre, v]) => ({ nombre, ...v })),
    porTortilla: [...porTortillaMap.entries()]
      .map(([nombre, v]) => ({ nombre, ...v }))
      .sort((a, b) => b.cantidad - a.cantidad),
    entregaVsRetiro: { envio: cantidadEnvios, retiro: cantidadRetiros },
    totalPedidos: pedidos.length,
  })
})

// GET /api/pedidos/mios -> los pedidos del cliente logueado (cualquier usuario, no solo admin)
// OJO: también va antes de /:id por el mismo motivo que estadisticas.
pedidosRouter.get('/mios', verificarToken, async (req, res) => {
  const pedidos = await Pedido.find({ cliente: req.usuario!.id })
    .populate('zona')
    .populate('puesto')
    .sort({ createdAt: -1 })
  res.json(pedidos)
})

// GET /api/pedidos/:id -> uno solo (solo admin)
pedidosRouter.get('/:id', verificarToken, requiereAdmin, async (req, res) => {
  const pedido = await Pedido.findById(req.params.id)
    .populate('zona')
    .populate('puesto')
    .populate('cliente', 'nombre email telefono')
  if (!pedido) return res.status(404).json({ error: 'No encontrado' })
  res.json(pedido)
})

// POST /api/pedidos -> crea un pedido nuevo desde el carrito del front.
// Ahora exige estar logueado (cliente o admin): el pedido queda atado a esa cuenta.
pedidosRouter.post('/', verificarToken, async (req, res) => {
  try {
    const {
      items,
      nombrePedido,
      entrega,
      zona: zonaId,
      localidad,
      puesto: puestoId,
      direccion,
      horarioEntrega,
      comentario,
      pago,
      montoEfectivo,
    } = req.body

    if (!items?.length) {
      return res.status(400).json({ error: 'El pedido no tiene items' })
    }
    if (!nombrePedido?.trim()) {
      return res.status(400).json({ error: 'Falta el nombre de la persona que recibe el pedido' })
    }

    let costoEnvio = 0
    let zona = null
    let puesto = null

    if (entrega === 'envio') {
      if (!direccion) {
        return res.status(400).json({ error: 'Falta la dirección para el envío' })
      }
      if (!localidad?.trim()) {
        return res.status(400).json({ error: 'Falta la localidad para el envío' })
      }
      if (pago !== 'transferencia') {
        return res.status(400).json({ error: 'Los envíos a domicilio solo aceptan transferencia' })
      }
      const cliente = await Usuario.findById(req.usuario!.id).select('puedeElegirHorario envioGratis')
      if (horarioEntrega && !cliente?.puedeElegirHorario) {
        return res.status(400).json({ error: 'Tu cuenta no puede elegir horario de entrega' })
      }
      zona = await Zona.findById(zonaId)
      if (!zona) return res.status(400).json({ error: 'Zona inválida' })
      costoEnvio = cliente?.envioGratis ? 0 : zona.envio
    } else if (entrega === 'retiro') {
      puesto = await Puesto.findById(puestoId)
      if (!puesto) return res.status(400).json({ error: 'Puesto de retiro inválido' })

      const tortillas = await Tortilla.find({
        _id: { $in: items.map((item: { tortilla: string }) => item.tortilla) },
      })
      const noDisponibles = tortillas.find(
        (tortilla) =>
          tortilla.puestosDisponibles !== undefined &&
          !tortilla.puestosDisponibles.some((id) => String(id) === String(puesto!._id)),
      )
      if (noDisponibles) {
        return res.status(400).json({ error: `${noDisponibles.nombre} no está disponible en ese puesto` })
      }
    } else {
      return res.status(400).json({ error: 'Tipo de entrega inválido' })
    }

    const subtotal = items.reduce(
      (acc: number, i: { precio: number; cantidad: number }) =>
        acc + i.precio * i.cantidad,
      0,
    )
    const total = subtotal + costoEnvio

    if (pago === 'efectivo' && montoEfectivo != null && montoEfectivo < total) {
      return res.status(400).json({ error: 'El monto en efectivo es menor al total del pedido' })
    }

    const pedido = await Pedido.create({
      cliente: req.usuario!.id,
      nombrePedido: nombrePedido.trim(),
      items,
      entrega,
      zona: zona?._id,
      localidad: entrega === 'envio' ? localidad.trim() : undefined,
      puesto: puesto?._id,
      direccion,
      horarioEntrega: entrega === 'envio' ? horarioEntrega : undefined,
      comentario,
      pago,
      montoEfectivo: pago === 'efectivo' ? montoEfectivo : undefined,
      subtotal,
      costoEnvio,
      total,
    })

    await notificarAdmins({
      titulo: 'Nuevo pedido',
      cuerpo: `Recibiste un pedido de $${total.toLocaleString('es-AR')}`,
      url: '/admin',
    })

    res.status(201).json(pedido)
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el pedido', detalle: err })
  }
})

// PUT /api/pedidos/:id/estado -> cambiar estado (solo admin)
pedidosRouter.put('/:id/estado', verificarToken, requiereAdmin, async (req, res) => {
  const { estado } = req.body
  const pedido = await Pedido.findByIdAndUpdate(req.params.id, { estado }, { new: true })
  if (!pedido) return res.status(404).json({ error: 'No encontrado' })
  const mensajes: Record<string, string> = {
    confirmado: 'Tu pedido fue confirmado',
    en_camino: 'Tu pedido está en camino',
    entregado: 'Tu pedido fue entregado',
    cancelado: 'Tu pedido fue cancelado',
  }
  if (mensajes[estado]) {
    await notificarUsuario(String(pedido.cliente), {
      titulo: mensajes[estado],
      cuerpo: estado === 'en_camino' ? 'El repartidor ya está llevando tu pedido.' : 'Revisá el estado en Mis pedidos.',
      url: '/mis-pedidos',
    })
  }
  res.json(pedido)
})

// PUT /api/pedidos/:id/seguimiento -> datos para el repartidor y el cliente
pedidosRouter.put('/:id/seguimiento', verificarToken, requiereAdmin, async (req, res) => {
  const { codigoReparto, linkUbicacion } = req.body
  const linkNormalizado = linkUbicacion?.trim()
    ? /^https?:\/\//i.test(linkUbicacion.trim())
      ? linkUbicacion.trim()
      : `https://${linkUbicacion.trim()}`
    : undefined
  const pedido = await Pedido.findByIdAndUpdate(
    req.params.id,
    { codigoReparto: codigoReparto?.trim() || undefined, linkUbicacion: linkNormalizado },
    { new: true },
  )
  if (!pedido) return res.status(404).json({ error: 'No encontrado' })
  if (codigoReparto?.trim() || linkUbicacion?.trim()) {
    await notificarUsuario(String(pedido.cliente), {
      titulo: 'Seguimiento disponible',
      cuerpo: 'Ya podés consultar el código y la ubicación de tu pedido.',
      url: '/mis-pedidos',
    })
  }
  res.json(pedido)
})

// PUT /api/pedidos/:id/transferencia -> el cliente informa una transferencia y adjunta
// el comprobante. El pedido queda pendiente de revisión del admin.
pedidosRouter.put(
  '/:id/transferencia',
  verificarToken,
  upload.single('comprobante'),
  async (req, res) => {
    const pedido = await Pedido.findOne({ _id: req.params.id, cliente: req.usuario!.id })
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' })
    if (pedido.pago !== 'transferencia') {
      return res.status(400).json({ error: 'Este pedido no es por transferencia' })
    }

    const titular = String(req.body.titular ?? '').trim()
    if (!titular) return res.status(400).json({ error: 'Indicá el titular de la transferencia' })
    if (!req.file && !pedido.comprobanteTransferencia) {
      return res.status(400).json({ error: 'Adjuntá el comprobante de la transferencia' })
    }

    pedido.transferenciaInformada = true
    pedido.transferenciaTitular = titular
    if (req.file) {
      pedido.comprobanteTransferencia = await subirArchivo(
        req.file,
        'tortillas-al-paso/comprobantes',
      )
    }
    await pedido.save()
    await notificarAdmins({
      titulo: 'Transferencia informada',
      cuerpo: 'Un cliente informó una transferencia y adjuntó su comprobante.',
      url: '/admin',
    })
    res.json(pedido)
  },
)

// PUT /api/pedidos/:id/pago-confirmado -> confirmar recepción (solo admin)
pedidosRouter.put('/:id/pago-confirmado', verificarToken, requiereAdmin, async (req, res) => {
  const pedido = await Pedido.findByIdAndUpdate(
    req.params.id,
    { pagoConfirmado: true },
    { new: true },
  )
  if (!pedido) return res.status(404).json({ error: 'No encontrado' })
  await notificarUsuario(String(pedido.cliente), {
    titulo: 'Pago confirmado',
    cuerpo: 'Confirmamos la recepción de tu transferencia.',
    url: '/mis-pedidos',
  })
  res.json(pedido)
})
