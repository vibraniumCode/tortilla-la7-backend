import { Router } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { verificarToken, requiereAdmin } from '../middleware/auth.js'

const storage = multer.memoryStorage()

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!permitidos.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP o PDF'))
    }
    cb(null, true)
  },
})

export async function subirArchivo(
  archivo: Express.Multer.File,
  carpeta: string,
): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: carpeta, resource_type: 'auto' },
      (error, resultado) => {
        if (error || !resultado?.secure_url) {
          reject(error ?? new Error('Cloudinary no devolvió una URL'))
          return
        }
        resolve(resultado.secure_url)
      },
    )
    stream.end(archivo.buffer)
  })
}

export const uploadsRouter = Router()

// POST /api/uploads -> sube una imagen (solo admin), devuelve la URL pública
uploadsRouter.post(
  '/',
  verificarToken,
  requiereAdmin,
  upload.single('imagen'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' })
    }
    try {
      const url = await subirArchivo(req.file, 'tortillas-al-paso/tortillas')
      res.status(201).json({ url })
    } catch (error) {
      console.error('Error subiendo archivo a Cloudinary:', error)
      res.status(502).json({ error: 'No se pudo guardar el archivo' })
    }
  },
)
