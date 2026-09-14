import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/Usuario.js'
import { verificarToken } from '../middleware/auth.js'

export const authRouter = Router()

function firmarToken(usuario: { _id: unknown; rol: string }) {
  return jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  })
}

// POST /api/auth/registro -> solo crea clientes (nunca admin desde acá)
authRouter.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const yaExiste = await Usuario.findOne({ email: email.toLowerCase() })
    if (yaExiste) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const usuario = await Usuario.create({
      nombre,
      email,
      telefono,
      passwordHash,
      rol: 'cliente',
    })

    const token = firmarToken(usuario)
    res.status(201).json({
      token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, puedeElegirHorario: usuario.puedeElegirHorario, envioGratis: usuario.envioGratis },
    })
  } catch (err) {
    res.status(400).json({ error: 'No se pudo registrar', detalle: err })
  }
})

// POST /api/auth/login -> sirve para clientes y para el admin
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos' })
  }

  const usuario = await Usuario.findOne({ email: email.toLowerCase() })
  if (!usuario) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' })
  }

  const ok = await bcrypt.compare(password, usuario.passwordHash)
  if (!ok) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' })
  }

  const token = firmarToken(usuario)
  res.json({
    token,
    usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, puedeElegirHorario: usuario.puedeElegirHorario, envioGratis: usuario.envioGratis },
  })
})

// GET /api/auth/me -> quién soy (según el token)
authRouter.get('/me', verificarToken, async (req, res) => {
  const usuario = await Usuario.findById(req.usuario!.id).select('-passwordHash')
  if (!usuario) return res.status(404).json({ error: 'No encontrado' })
  res.json(usuario)
})
