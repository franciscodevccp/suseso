/**
 * Arranque del servidor SISGA (docs/02). Un solo proceso Express que en
 * producción sirve también el build del front (`dist/`) — decisión D-05.
 * En desarrollo, Vite corre aparte y proxya `/api` hacia este puerto.
 *
 * Sin endpoint de salud: front y API viven en el mismo proceso, así que
 * el monitoreo se hace directo sobre el sitio (decisión del 2026-08-26,
 * registro en docs/17).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pg from 'pg'
import { pino } from 'pino'
import { config, esProduccion } from './src/config.js'
import { manejadorErrores } from './src/http/errores.js'
import { cargarUsuario } from './src/middleware/sesion.js'
import { rutasActas } from './src/rutas/actas.js'
import { rutasActivos } from './src/rutas/activos.js'
import { rutasAuditoria } from './src/rutas/auditoria.js'
import { rutasAlertas } from './src/rutas/alertas.js'
import { rutasAlmacen } from './src/rutas/almacen.js'
import { rutasAuth } from './src/rutas/auth.js'
import { rutasCatalogos } from './src/rutas/catalogos.js'
import { rutasConfiguracion } from './src/rutas/configuracion.js'
import { rutasDashboard } from './src/rutas/dashboard.js'
import { rutasReportes } from './src/rutas/reportes.js'
import { rutasUsuarios } from './src/rutas/usuarios.js'

const logger = pino({ level: esProduccion ? 'info' : 'debug' })
const app = express()

// Detrás del proxy de despliegue (TLS lo pone el proxy; cookies `secure`).
app.set('trust proxy', 1)
app.disable('x-powered-by')

// Cabeceras según docs/14: CSP compatible con el build de Vite,
// sin iframes, sin sniffing de tipos.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Sesión en PostgreSQL (docs/14): cookie httpOnly, 30 min de inactividad
// (rolling). El TTL absoluto de 8 h se aplica en el middleware de sesión
// junto con la autenticación (bloque A1, paso de auth).
const PgSession = connectPgSimple(session)
const pool = new pg.Pool({ connectionString: config.DATABASE_URL })
app.use(
  session({
    // La tabla "session" la crea la migración de Prisma, no el middleware.
    store: new PgSession({ pool, createTableIfMissing: false }),
    name: 'sisga.sid',
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: esProduccion,
      maxAge: 30 * 60 * 1000,
    },
  }),
)

// Las rutas de la API se montan aquí a medida que se construyen (docs/03).
const api = express.Router()
api.use(cargarUsuario)
api.use('/auth', rutasAuth)
api.use('/catalogos', rutasCatalogos)
api.use('/activos', rutasActivos)
api.use('/almacen', rutasAlmacen)
api.use('/actas', rutasActas)
api.use('/alertas', rutasAlertas)
api.use('/auditoria', rutasAuditoria)
api.use('/dashboard', rutasDashboard)
api.use('/reportes', rutasReportes)
api.use('/usuarios', rutasUsuarios)
api.use('/configuracion', rutasConfiguracion)
app.use('/api', api)

// Cualquier ruta /api no registrada responde en el formato { codigo, mensaje }.
app.use('/api', (_req, res) => {
  res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Recurso no encontrado.' })
})

// Producción: estáticos del build con fallback SPA para las rutas del router.
const raiz = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(raiz, '..', 'dist')
app.use(express.static(dist))
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
  res.sendFile(path.join(dist, 'index.html'), (err) => {
    if (err) next()
  })
})

app.use(manejadorErrores(logger))

app.listen(config.PUERTO, () => {
  logger.info(`SISGA escuchando en http://localhost:${config.PUERTO}`)
})
