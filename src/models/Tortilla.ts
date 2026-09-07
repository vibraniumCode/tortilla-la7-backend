import { Schema, model } from 'mongoose'

export interface ITortilla {
  nombre: string
  descripcion: string
  precio: number
  imagen: string
  nueva: boolean
  activa: boolean
}

const tortillaSchema = new Schema<ITortilla>(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true },
    imagen: { type: String, required: true },
    nueva: { type: Boolean, default: false },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Tortilla = model<ITortilla>('Tortilla', tortillaSchema)
