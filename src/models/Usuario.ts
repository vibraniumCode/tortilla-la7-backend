import { Schema, model } from 'mongoose'

export interface INotificacionSuscripcion {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export interface IUsuario {
  nombre: string
  email: string
  passwordHash: string
  telefono?: string
  puedeElegirHorario: boolean
  envioGratis: boolean
  rol: 'cliente' | 'admin'
  suscripcionesNotificaciones: INotificacionSuscripcion[]
}

const usuarioSchema = new Schema<IUsuario>(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    telefono: { type: String },
    puedeElegirHorario: { type: Boolean, default: false },
    envioGratis: { type: Boolean, default: false },
    rol: { type: String, enum: ['cliente', 'admin'], default: 'cliente' },
    suscripcionesNotificaciones: {
      type: [
        {
          endpoint: { type: String, required: true },
          expirationTime: { type: Number, default: null },
          keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
)

export const Usuario = model<IUsuario>('Usuario', usuarioSchema)
