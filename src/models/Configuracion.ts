import { Schema, model } from 'mongoose'

export interface IConfiguracion {
  aliasTransferencia: string
  cbu?: string
  titular?: string
}

const configuracionSchema = new Schema<IConfiguracion>(
  {
    aliasTransferencia: { type: String, default: '' },
    cbu: { type: String },
    titular: { type: String },
  },
  { timestamps: true },
)

// Documento único: siempre usamos el primero que exista.
export const Configuracion = model<IConfiguracion>('Configuracion', configuracionSchema)
