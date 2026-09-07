import { Schema, model, Types } from 'mongoose'

export interface IItemPedido {
  tortilla: Types.ObjectId
  nombre: string
  precio: number
  cantidad: number
}

export interface IPedido {
  cliente: Types.ObjectId
  items: IItemPedido[]
  entrega: 'envio' | 'retiro'
  zona?: Types.ObjectId
  puesto?: Types.ObjectId
  direccion?: string
  comentario?: string
  pago: 'efectivo' | 'transferencia'
  montoEfectivo?: number
  pagoConfirmado: boolean
  transferenciaInformada: boolean
  transferenciaTitular?: string
  comprobanteTransferencia?: string
  subtotal: number
  costoEnvio: number
  total: number
  estado: 'pendiente' | 'confirmado' | 'en_camino' | 'entregado' | 'cancelado'
}

const itemPedidoSchema = new Schema<IItemPedido>(
  {
    tortilla: { type: Schema.Types.ObjectId, ref: 'Tortilla', required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    cantidad: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const pedidoSchema = new Schema<IPedido>(
  {
    items: { type: [itemPedidoSchema], required: true },
    cliente: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    entrega: { type: String, enum: ['envio', 'retiro'], required: true },
    zona: { type: Schema.Types.ObjectId, ref: 'Zona' },
    puesto: { type: Schema.Types.ObjectId, ref: 'Puesto' },
    direccion: { type: String },
    comentario: { type: String },
    pago: { type: String, enum: ['efectivo', 'transferencia'], required: true },
    montoEfectivo: { type: Number },
    pagoConfirmado: { type: Boolean, default: false },
    transferenciaInformada: { type: Boolean, default: false },
    transferenciaTitular: { type: String },
    comprobanteTransferencia: { type: String },
    subtotal: { type: Number, required: true },
    costoEnvio: { type: Number, required: true },
    total: { type: Number, required: true },
    estado: {
      type: String,
      enum: ['pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado'],
      default: 'pendiente',
    },
  },
  { timestamps: true },
)

export const Pedido = model<IPedido>('Pedido', pedidoSchema)
