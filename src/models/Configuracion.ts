import { Schema, model } from 'mongoose'

export interface IConfiguracion {
  whatsapp: string
  aliasTransferencia: string
  cbu?: string
  titular?: string
}

const configuracionSchema = new Schema<IConfiguracion>(
  {
    whatsapp: { type: String, default: '' },
    aliasTransferencia: { type: String, default: '' },
    cbu: { type: String },
    titular: { type: String },
  },
  { timestamps: true },
)

// Documento único: siempre usamos el primero que exista.
export const Configuracion = model<IConfiguracion>('Configuracion', configuracionSchema)
