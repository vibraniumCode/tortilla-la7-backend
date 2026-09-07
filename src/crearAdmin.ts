import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { conectarDB } from './db.js'
import { Usuario } from './models/Usuario.js'

dotenv.config()

async function crearAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const nombre = process.env.ADMIN_NOMBRE ?? 'Administrador'

  if (!email || !password) {
    console.error(
      'Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en el .env. Agregalos y volvé a correr este script.',
    )
    process.exit(1)
  }

  await conectarDB()

  const yaExiste = await Usuario.findOne({ email: email.toLowerCase() })
  if (yaExiste) {
    console.log(`Ya existe un usuario con ese email (rol actual: ${yaExiste.rol}).`)
    await mongoose.disconnect()
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await Usuario.create({ nombre, email, passwordHash, rol: 'admin' })

  console.log(`Admin creado: ${email}`)
  await mongoose.disconnect()
}

crearAdmin().catch((err) => {
  console.error(err)
  process.exit(1)
})
