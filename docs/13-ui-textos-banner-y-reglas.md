# 13 — UI, textos, banner y reglas ya decididas

## Banner global de demostración (obligatorio en todas las pantallas, incluido el login)
Componente `BannerDemostracion` en `components/layout/`, ámbar, delgado, fijo arriba de `AppLayout` y `AuthLayout`:
`Entorno de demostración — datos ficticios. Instancia de evaluación para la licitación 1607-11-LE26.`
No se puede cerrar. Oculto solo en la vista de impresión de etiquetas.

## Login (`LoginPage.jsx`)
- El `<details>` "Cuentas de demostración (entorno mock)" pasa a un bloque siempre visible **"Cuentas de demostración"** con 4 tarjetas clicables (rol, correo) que rellenan el formulario; la clave se muestra en texto (`CLAVE_DEMO` la entrega el servidor en `GET /api/auth/cuentas-demo`, activo solo si `MOSTRAR_CUENTAS_DEMO=true`).
- Eliminar el botón "Reiniciar datos de demostración" y sus 4 importaciones de mocks. La función pasa a **Configuración → Reiniciar demo** (solo Administrador, con confirmación).
- Cuentas con dominio `@demo.cl`; nunca `@suseso.gob.cl`.
- `index.html`: título `SISGA · Gestión de activos fijos y almacén` (o el nombre definitivo, `docs/17` T-01).

## Módulo "Actas y firma" → "Actas de asignación" (decisión D-03: FEA no se menciona)
- Ruta `/actas-y-firma` → `/actas`; etiqueta del Sidebar "Actas"; título "Actas de asignación y entrega".
- `firmarActa` → `cerrarActa`; `ModalConfirmarFirma` → `ModalCerrarActa`: título "Cerrar acta", texto "Al cerrar el acta se genera un sello de integridad (SHA-256) que permite verificar que su contenido no fue modificado. Esta acción no se puede deshacer." Botón "Cerrar acta".
- Campos: `estadoFirma` → `estado` (`pendiente | cerrada`), `firmante` → `cerradaPor`, `fechaFirma` → `fechaCierre`, `selloVerificacion` → `selloIntegridad`. `mensajesActas.js`, `estadoActa.js`, `TablaActas`, `FichaActaPage`: reemplazar toda mención a "firma", "firmar", "firmada", "firma electrónica", "avanzada", "Ley 19.799" y "proveedor acreditado". Buscar con `grep -rni "firma" src/features/actas` hasta que devuelva cero.
- El sello se calcula en el servidor; la ficha muestra el sello y un botón "Verificar integridad" que recalcula y compara.

## Textos y formato
- Todo en español, sin jerga técnica visible ("Guardar", "Dar de baja", "Valor libro"); nada de "mock", "API", "backend", "token", "commit" fuera de `/integraciones`.
- Cifras `$1.234.567` (`formatoMoneda.js` ya existe), fechas `dd-mm-aaaa`, términos contables correctos (valor libro, depreciación acumulada, vida útil).
- Estados vacíos con explicación y acción; errores en lenguaje humano (los archivos `mensajes*.js` ya siguen este patrón: continuar igual en Usuarios, Auditoría, Alertas, Solicitudes, Importador).
- `EncabezadoInstitucional`: mantener "Superintendencia de Seguridad Social" como institución destinataria; el producto se nombra desde una constante única `src/config/producto.js` (`NOMBRE_PRODUCTO`), usada en encabezado, título, manual y `openapi.yaml`.

## Módulos y Sidebar finales
Inicio · Activos fijos · Almacén · Solicitudes · Alertas (badge) · Actas · Integraciones · Reportes · Auditoría · Autoconsulta · Configuración (Vida útil, Campos personalizados, Perfiles y permisos, Importar planilla, Reiniciar demo) · Usuarios (solo Administrador). Funcionario: Autoconsulta, Mis solicitudes, Nueva solicitud.

## Responsive y navegadores
Verificar a 360 px las pantallas nuevas (Usuarios, Auditoría, Alertas, Solicitudes, Importador, Adjuntos) y el portal completo en móvil real; probar en Chrome, Edge y Firefox antes de entregar (RQ-02, RQ-05). Accesibilidad básica: etiquetas en todos los campos, foco visible, contraste AA en el banner.
