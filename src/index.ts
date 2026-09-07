import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { conectarDB } from './db.js'
import { tortillasRouter } from './routes/tortillas.js'
import { zonasRouter } from './routes/zonas.js'
import { puestosRouter } from './routes/puestos.js'
import { novedadesRouter } from './routes/novedades.js'
import { pedidosRouter } from './routes/pedidos.js'
import { authRouter } from './routes/auth.js'
import { uploadsRouter } from './routes/uploads.js'
import { configuracionRouter } from './routes/configuracion.js'
import { mercadopagoRouter } from './routes/mercadopago.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Sirve las imágenes subidas: http://localhost:4000/uploads/archivo.png
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authRouter)
app.use('/api/tortillas', tortillasRouter)
app.use('/api/zonas', zonasRouter)
app.use('/api/puestos', puestosRouter)
app.use('/api/novedades', novedadesRouter)
app.use('/api/pedidos', pedidosRouter)
app.use('/api/uploads', uploadsRouter)
app.use('/api/configuracion', configuracionRouter)
app.use('/api/mercadopago', mercadopagoRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

const PORT = process.env.PORT ?? 4000

conectarDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err)
    process.exit(1)
  })
