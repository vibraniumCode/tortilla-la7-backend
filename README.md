# Tortillas al Paso — Backend

API en Node + Express + TypeScript + MongoDB (Mongoose).

## Cómo correrlo

1. Copiá `.env.example` a `.env` y completá:
   - MONGODB_URI (tu URI real de Mongo)
   - JWT_SECRET (una clave larga y secreta, inventada por vos)
  - ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NOMBRE (los datos del dueño)
  - CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET (para imágenes y comprobantes)
2. `npm install`
3. `npm run seed`         -> carga zonas, puestos, tortillas y novedades de arranque
4. `npm run crear-admin`  -> crea el usuario admin (dueño) con los datos del .env
5. `npm run dev`          -> levanta el servidor en http://localhost:4000

## Autenticación

- Los **clientes se registran solos** desde el front (`POST /api/auth/registro`).
  Ese endpoint SIEMPRE crea usuarios con rol "cliente" — no se puede crear un
  admin por ahí, ni mandando el campo `rol` a mano.
- El **admin (dueño) se crea una sola vez** con `npm run crear-admin`, usando
  el email/contraseña que pusiste en el `.env`. No hay pantalla pública para
  crear más admins — si en el futuro necesitás otro, se corre el script de
  nuevo con otro email, o se cambia el rol a mano en Atlas.
- Login es el mismo endpoint para los dos roles: `POST /api/auth/login`.
  Devuelve un token (JWT) que dura 30 días.
- Las rutas de **lectura** (GET) de tortillas/zonas/puestos/novedades son
  públicas, no requieren login — cualquiera que entra a la tienda las ve.
- Las rutas de **escritura** (POST/PUT/DELETE) de esos mismos recursos
  requieren mandar el token en el header `Authorization: Bearer <token>`,
  y ese token tiene que ser de un usuario con rol "admin". Si no, la API
  responde 401 (sin token) o 403 (token válido pero no es admin).
- Crear un pedido (`POST /api/pedidos`) sigue siendo público — un cliente
  puede pedir sin loguearse. Si más adelante querés asociar pedidos a la
  cuenta del cliente (para que vea su historial), avisame y lo sumamos.

## Endpoints

### Auth
- POST /api/auth/registro -> crea una cuenta de cliente
- POST /api/auth/login    -> login de cliente o admin, devuelve token
- GET  /api/auth/me       -> datos del usuario logueado (requiere token)

### Tortillas
- GET    /api/tortillas       -> lista las activas
- POST   /api/tortillas       -> crear
- PUT    /api/tortillas/:id   -> editar
- DELETE /api/tortillas/:id   -> baja lógica (no la borra, la desactiva)

### Zonas (áreas de envío, con costo)
- GET  /api/zonas       -> lista las activas
- POST /api/zonas       -> crear
- PUT  /api/zonas/:id   -> editar costo de envío

### Puestos (puntos físicos de retiro)
- GET    /api/puestos       -> lista los activos
- POST   /api/puestos       -> crear (ej: nuevo punto de retiro)
- PUT    /api/puestos/:id   -> editar
- DELETE /api/puestos/:id   -> baja lógica

### Novedades (slides del carousel de la home)
- GET    /api/novedades         -> lista las activas, ordenadas
- GET    /api/novedades/todas   -> lista todas, incluidas inactivas (para el panel admin)
- POST   /api/novedades         -> crear
- PUT    /api/novedades/:id     -> editar
- DELETE /api/novedades/:id     -> baja lógica

### Imágenes
- POST /api/uploads -> sube una imagen (solo admin, campo del form-data:
  "imagen"). Devuelve una URL pública de Cloudinary.

### Pedidos
 PUT  /api/pedidos/:id/transferencia -> el cliente informa titular y comprobante
 PUT  /api/pedidos/:id/pago-confirmado -> el admin confirma que recibió el pago

### Configuración
- GET /api/configuracion -> alias de transferencia, etc. (público)
- PUT /api/configuracion -> editar (solo admin)

### Mercado Pago (inactivo hasta cargar MP_ACCESS_TOKEN en el .env)
- POST /api/mercadopago/preferencia -> crea el link de pago para un pedido
- POST /api/mercadopago/webhook     -> Mercado Pago avisa acá cuando se aprueba un pago
  (necesita MP_WEBHOOK_URL pública — no funciona apuntando a localhost)

## Pendiente / a definir
- No hay autenticación todavía (ni de clientes ni de admin). Si vas a tener
  un panel para manejar pedidos, en algún momento hay que sumar login.
- El front (tortillas-app) todavía lee datos hardcodeados en
  src/data/tortillas.ts. El próximo paso es que haga fetch a esta API
  en vez de usar ese archivo estático.
- Los PRECIOS del seed son de ejemplo. Cambialos por los reales en
  src/seed.ts antes de usar esto con clientes de verdad.
- Las imágenes del seed son placeholders (de placehold.co) — reemplazalas
  subiendo la foto real de cada tortilla desde el panel de admin.
- Las imágenes y comprobantes se guardan en Cloudinary, para que no se pierdan
  cuando Render reinicia o vuelve a desplegar el backend.
- Ya tenías datos cargados de antes (npm run seed viejo). Volvé a correr
  npm run seed para que se borren y se recarguen con las variedades,
  zonas y puestos actualizados.
