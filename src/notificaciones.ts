import 'dotenv/config'
import webpush from 'web-push'
import { Usuario, type INotificacionSuscripcion } from './models/Usuario.js'

const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

export function notificacionesConfiguradas() {
  return Boolean(publicKey && privateKey && subject)
}

export function clavePublicaNotificaciones() {
  return publicKey ?? ''
}

export async function guardarSuscripcion(usuarioId: string, suscripcion: INotificacionSuscripcion) {
  await Usuario.findByIdAndUpdate(usuarioId, {
    $pull: { suscripcionesNotificaciones: { endpoint: suscripcion.endpoint } },
  })
  await Usuario.findByIdAndUpdate(usuarioId, {
    $push: { suscripcionesNotificaciones: suscripcion },
  })
}

export async function enviarNotificacion(
  usuarios: Array<{ _id: unknown; suscripcionesNotificaciones: INotificacionSuscripcion[] }>,
  payload: { titulo: string; cuerpo: string; url?: string },
) {
  if (!notificacionesConfiguradas()) return

  const suscripciones = usuarios.flatMap((usuario) => usuario.suscripcionesNotificaciones ?? [])
  await Promise.all(
    suscripciones.map(async (suscripcion) => {
      try {
        await webpush.sendNotification(suscripcion, JSON.stringify(payload))
      } catch (error: unknown) {
        const estado = (error as { statusCode?: number }).statusCode
        if (estado === 404 || estado === 410) {
          await Usuario.updateMany(
            { 'suscripcionesNotificaciones.endpoint': suscripcion.endpoint },
            { $pull: { suscripcionesNotificaciones: { endpoint: suscripcion.endpoint } } },
          )
        } else {
          console.error('No se pudo enviar una notificacion push:', error)
        }
      }
    }),
  )
}

export async function notificarAdmins(payload: { titulo: string; cuerpo: string; url?: string }) {
  const admins = await Usuario.find({ rol: 'admin' }).select('suscripcionesNotificaciones')
  await enviarNotificacion(admins, payload)
}

export async function notificarUsuario(usuarioId: string, payload: { titulo: string; cuerpo: string; url?: string }) {
  const usuario = await Usuario.findById(usuarioId).select('suscripcionesNotificaciones')
  if (usuario) await enviarNotificacion([usuario], payload)
}
