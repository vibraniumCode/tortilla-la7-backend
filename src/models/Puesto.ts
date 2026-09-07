import { Schema, model } from 'mongoose'

export interface IPuesto {
  nombre: string
  direccion: string
  activo: boolean
}

const puestoSchema = new Schema<IPuesto>(
  {
    nombre: { type: String, required: true },
    direccion: { type: String, required: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Puesto = model<IPuesto>('Puesto', puestoSchema)
