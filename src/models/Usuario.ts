import { Schema, model } from 'mongoose'

export interface IUsuario {
  nombre: string
  email: string
  passwordHash: string
  telefono?: string
  rol: 'cliente' | 'admin'
}

const usuarioSchema = new Schema<IUsuario>(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    telefono: { type: String },
    rol: { type: String, enum: ['cliente', 'admin'], default: 'cliente' },
  },
  { timestamps: true },
)

export const Usuario = model<IUsuario>('Usuario', usuarioSchema)
