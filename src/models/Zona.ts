import { Schema, model } from 'mongoose'

export interface IZona {
  nombre: string
  envio: number
  activa: boolean
}

const zonaSchema = new Schema<IZona>(
  {
    nombre: { type: String, required: true, unique: true },
    envio: { type: Number, required: true },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Zona = model<IZona>('Zona', zonaSchema)
