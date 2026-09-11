import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { conectarDB } from './db.js'
import { Usuario } from './models/Usuario.js'

dotenv.config()

async function crearClienteEspecial() {
  const email = process.env.CLIENTE_ESPECIAL_EMAIL
  const password = process.env.CLIENTE_ESPECIAL_PASSWORD
  const nombre = process.env.CLIENTE_ESPECIAL_NOMBRE ?? 'Cliente fábrica'

  if (!email || !password) {
    console.error('Faltan CLIENTE_ESPECIAL_EMAIL y CLIENTE_ESPECIAL_PASSWORD en el .env.')
    process.exit(1)
  }

  await conectarDB()
  const passwordHash = await bcrypt.hash(password, 10)
  await Usuario.findOneAndUpdate(
    { email: email.toLowerCase() },
    { nombre, email: email.toLowerCase(), passwordHash, rol: 'cliente', puedeElegirHorario: true },
    { upsert: true, new: true },
  )
  console.log(`Cliente especial creado/actualizado: ${email}`)
  await mongoose.disconnect()
}

crearClienteEspecial().catch((err) => {
  console.error(err)
  process.exit(1)
})