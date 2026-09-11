import dotenv from 'dotenv'
import { conectarDB } from './db.js'
import { Tortilla } from './models/Tortilla.js'
import { Zona } from './models/Zona.js'
import { Puesto } from './models/Puesto.js'
import { Novedad } from './models/Novedad.js'
import mongoose from 'mongoose'

dotenv.config()

// OJO: los precios de acá abajo son de ejemplo (placeholder).
// Cambialos por los reales antes de usar esto en producción.

async function seed() {
  await conectarDB()

  const zonas = [
    { nombre: 'Berazategui Centro', envio: 500 },
    { nombre: 'Quilmes', envio: 700 },
    { nombre: 'Espeleta', envio: 600 },
  ]
  for (const zona of zonas) {
    await Zona.findOneAndUpdate({ nombre: zona.nombre }, zona, { upsert: true, new: true })
  }

  const puestos = [
    { nombre: 'Berazategui', direccion: 'Av. 7 esq. 109' },
    { nombre: 'La Florida', direccion: 'Av. 844 esq. 873' },
    { nombre: 'Feria Senzabello', direccion: 'Feria Senzabello' },
    { nombre: 'Derqui', direccion: '4772 entre Andrés Bruzone y Salta' },
  ]
  for (const puesto of puestos) {
    await Puesto.findOneAndUpdate({ nombre: puesto.nombre }, puesto, { upsert: true, new: true })
  }

  const tortillasBase = [
    {
      nombre: 'Jamón y Mozzarella',
      descripcion: 'La clásica, jamón cocido y mozzarella bien gratinada.',
      precio: 3200,
      imagen: 'https://placehold.co/300x300/ec740f/faf6f1?text=Tortilla',
    },
    {
      nombre: 'Jamón y Cheddar',
      descripcion: 'Jamón cocido con cheddar bien fundido.',
      precio: 3300,
      imagen: 'https://placehold.co/300x300/ec740f/faf6f1?text=Tortilla',
    },
    {
      nombre: 'Jamón y Roquefort',
      descripcion: 'Jamón cocido con roquefort, para los que se animan.',
      precio: 3800,
      imagen: 'https://placehold.co/300x300/ec740f/faf6f1?text=Tortilla',
    },
    {
      nombre: 'Salame y Mozzarella',
      descripcion: 'Salame picado grueso con mozzarella.',
      precio: 3500,
      imagen: 'https://placehold.co/300x300/ec740f/faf6f1?text=Tortilla',
    },
    {
      nombre: 'Bondiola Desmenuzada',
      descripcion: 'Bondiola cocida a fuego lento y desmenuzada.',
      precio: 4500,
      imagen: 'https://placehold.co/300x300/ec740f/faf6f1?text=Tortilla',
      nueva: true,
    },
    {
      nombre: 'Simple',
      descripcion: 'La de siempre, masa a la piedra bien caliente.',
      precio: 2500,
      imagen: 'https://placehold.co/300x300/ec740f/faf6f1?text=Tortilla',
    },
  ]
  const tortillas = []
  for (const tortilla of tortillasBase) {
    tortillas.push(
      await Tortilla.findOneAndUpdate({ nombre: tortilla.nombre }, tortilla, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }),
    )
  }

  const roquefort = tortillas.find((t) => t.nombre === 'Jamón y Roquefort')
  const bondiola = tortillas.find((t) => t.nombre === 'Bondiola Desmenuzada')

  const novedades = [
    {
      eyebrow: 'Tortilla del día',
      titulo: roquefort?.nombre,
      descripcion: roquefort?.descripcion,
      cta: 'Pedir ahora',
      precio: roquefort?.precio,
      tortilla: roquefort?._id,
      orden: 1,
    },
    {
      eyebrow: 'Nueva en la carta',
      titulo: bondiola?.nombre,
      descripcion: bondiola?.descripcion,
      cta: 'Probarla',
      precio: bondiola?.precio,
      tortilla: bondiola?._id,
      orden: 2,
    },
    {
      eyebrow: 'Novedad',
      titulo: 'Feria Senzabello',
      descripcion: 'Abrimos puesto nuevo. Ya podés retirar en esta feria.',
      cta: 'Ver puestos',
      orden: 3,
    },
  ]
  for (const novedad of novedades) {
    await Novedad.findOneAndUpdate({ titulo: novedad.titulo }, novedad, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })
  }

  console.log('Seed completo: zonas, puestos, tortillas y novedades cargadas')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
