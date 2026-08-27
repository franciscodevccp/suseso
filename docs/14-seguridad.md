# 14 — Seguridad

Premisa: **las credenciales de la demo van dentro de una oferta pública.** Cualquier persona, competidores incluidos, podrá entrar durante semanas. La demo debe ser indestructible desde adentro y aburrida de atacar desde afuera.

## Autenticación
- Contraseñas con argon2id; reglas de `shared/passwordRules.js` aplicadas en servidor (la UI solo previsualiza).
- Bloqueo a los 5 intentos fallidos (ya existe en el mock; se replica). Rate limit `POST /api/auth/login`: 10 por IP cada 15 min; `recuperar`: 5 por hora.
- Cookie de sesión `httpOnly`, `sameSite=lax`, `secure` en producción, sin token en `localStorage`. TTL 8 h absoluto, 30 min de inactividad.
- Recuperación de clave: token aleatorio de 32 bytes, 15 min, un solo uso, hash en BD (`TokenRecuperacion`). Como no hay correo, el enlace se muestra en pantalla **solo para cuentas no demo** y solo en modo demostración; para cuentas demo responde el mensaje genérico sin enlace.

## Autorización — en el servidor, siempre
- `autorizar(...roles)` en cada ruta; `Consulta` no puede ejecutar ninguna mutación (test obligatorio); `Funcionario` no accede a ninguna ruta del panel.
- El solicitante solo ve sus solicitudes y sus bienes: filtro por `usuarioId` de sesión, nunca por parámetro del cliente.
- Adjuntos: el handler verifica sesión y que el rol pueda ver activos antes de leer el archivo.

## Cuentas demo endurecidas (`esCuentaDemo = true`)
- No pueden cambiar clave ni correo (`CUENTA_DEMO`), no se pueden desactivar, eliminar ni cambiar de rol; el Administrador demo no puede desactivar el banner ni tocar variables del despliegue.
- Un visitante puede crear, editar, dar de baja y subir archivos: es la demo. Para que la comisión siempre encuentre orden: `Configuración → Reiniciar demo` (Administrador) restaura el seed en < 60 s, y **opcional (P2)** un reinicio automático diario a las 03:30.

## API pública `/api/v1`
- `X-API-Key` comparada con `crypto.timingSafeEqual` sobre hashes de igual largo. Sin clave → 401; nunca 500 con stack trace.
- Solo lectura salvo el webhook demo, que escribe únicamente en `Configuracion`. Paginación máxima 100. Rate limit 60/min por clave y por IP.

## Archivos
- Whitelist por contenido (magic bytes), 10 MB por adjunto, 20 MB la planilla; nombre aleatorio; `storage/` fuera de cualquier ruta estática; anti path-traversal resolviendo la ruta y verificando el prefijo.
- El Excel del importador se procesa en memoria y se descarta; la previsualización guardada no contiene el archivo, solo filas parseadas, con TTL.

## Entrada, salida, cabeceras
- zod en toda entrada (rutas, query, campos multipart). Prisma parametrizado; SQL crudo solo en la secuencia de folios.
- `helmet` con CSP compatible con Vite (`script-src 'self'`; en desarrollo permitir HMR), `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`. HSTS lo pone el proxy de Francisco.
- CORS solo `ORIGEN_PERMITIDO` (en producción front y API comparten origen: CORS puede quedar apagado).
- Logs pino sin contraseñas, tokens ni cuerpos de login.

## Secretos y operación
- Solo `.env` (repo privado igual). `MP_API_TICKET` y `API_DEMO_KEY` nunca viajan al navegador (la API key demo se imprime en el manual, no en el código del front).
- Respaldos (`docs/02`) y restauración ensayada una vez antes de entregar.
- **Post-adjudicación:** rotar `CLAVE_DEMO` y `API_DEMO_KEY`; los valores de la oferta quedan públicos para siempre.
- Ley 19.628 / Ley 21.719: datos 100 % ficticios en la demo; igual se trata todo como confidencial y así se declara en la propuesta.
