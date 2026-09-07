import { Schema, model, Types } from 'mongoose'

export interface INovedad {
  eyebrow: string
  titulo: string
  descripcion: string
  cta: string
  precio?: number
  tortilla?: Types.ObjectId
  orden: number
  activa: boolean
}

const novedadSchema = new Schema<INovedad>(
  {
    eyebrow: { type: String, required: true },
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    cta: { type: String, required: true, default: 'Pedir ahora' },
    precio: { type: Number },
    tortilla: { type: Schema.Types.ObjectId, ref: 'Tortilla' },
    orden: { type: Number, default: 0 },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Novedad = model<INovedad>('Novedad', novedadSchema)
