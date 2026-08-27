-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'GESTOR', 'CONSULTA', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('activo', 'inactivo', 'bloqueado');

-- CreateEnum
CREATE TYPE "EstadoActivo" AS ENUM ('activo', 'en_reparacion', 'dado_de_baja', 'extraviado');

-- CreateEnum
CREATE TYPE "TipoMovActivo" AS ENUM ('alta', 'edicion', 'traslado', 'baja', 'reparacion');

-- CreateEnum
CREATE TYPE "TipoMovAlmacen" AS ENUM ('ingreso', 'egreso');

-- CreateEnum
CREATE TYPE "EstadoActa" AS ENUM ('pendiente', 'cerrada');

-- CreateEnum
CREATE TYPE "TipoAdjunto" AS ENUM ('foto', 'pdf', 'orden_compra', 'garantia', 'otro');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'aprobada', 'rechazada', 'entregada');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "claveHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'activo',
    "claveTemporal" BOOLEAN NOT NULL DEFAULT false,
    "fechaUltimoCambioClave" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "esCuentaDemo" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenRecuperacion" (
    "token" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenRecuperacion_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "vidaUtilAnios" INTEGER NOT NULL,
    "vidaUtilAcelerada" INTEGER,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'oficina',

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT,
    "correo" TEXT,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activo" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "codigoBarras" TEXT NOT NULL,
    "rfid" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "categoria" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "responsable" TEXT NOT NULL DEFAULT '',
    "estado" "EstadoActivo" NOT NULL DEFAULT 'activo',
    "valor" DECIMAL(14,2) NOT NULL,
    "fechaAlta" TIMESTAMP(3) NOT NULL,
    "fechaBaja" TIMESTAMP(3),
    "motivoBaja" TEXT,
    "proximaMantencion" TIMESTAMP(3),
    "finGarantia" TIMESTAMP(3),
    "camposPersonalizados" JSONB,
    "ordenCompraMPCodigo" TEXT,
    "fotoPrincipalId" TEXT,

    CONSTRAINT "Activo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoActivo" (
    "id" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "tipo" "TipoMovActivo" NOT NULL,
    "detalle" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "usuarioId" TEXT,
    "ubicacionAnterior" TEXT,
    "ubicacionNueva" TEXT,
    "responsableAnterior" TEXT,
    "responsableNuevo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoActivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjunto" (
    "id" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "tipo" "TipoAdjunto" NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "subidoPor" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Adjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAlmacen" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "ubicacion" TEXT NOT NULL,

    CONSTRAINT "ItemAlmacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoAlmacen" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tipo" "TipoMovAlmacen" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stockResultante" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL DEFAULT '',
    "usuario" TEXT NOT NULL,
    "solicitudId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoAlmacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acta" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "activoId" TEXT,
    "activoFolio" TEXT,
    "activoNombre" TEXT,
    "responsable" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "estado" "EstadoActa" NOT NULL DEFAULT 'pendiente',
    "cerradaPor" TEXT,
    "fechaCierre" TIMESTAMP(3),
    "selloIntegridad" TEXT,
    "creadaPor" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Acta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "solicitanteNombre" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "observacion" TEXT NOT NULL DEFAULT '',
    "resueltaPor" TEXT,
    "fechaResolucion" TIMESTAMP(3),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudItem" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemNombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "SolicitudItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenCompraMP" (
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "proveedor" TEXT,
    "monto" DECIMAL(14,2),
    "fecha" TIMESTAMP(3),
    "estado" TEXT,
    "jsonCrudo" JSONB NOT NULL,
    "sincronizadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrdenCompraMP_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "usuarioNombre" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" TEXT,
    "entidadFolio" TEXT,
    "detalle" TEXT NOT NULL,
    "ip" TEXT,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "Secuencia" (
    "nombre" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,

    CONSTRAINT "Secuencia_pkey" PRIMARY KEY ("nombre")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Ubicacion_nombre_key" ON "Ubicacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_nombre_key" ON "Funcionario"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Activo_folio_key" ON "Activo"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Activo_codigoBarras_key" ON "Activo"("codigoBarras");

-- CreateIndex
CREATE UNIQUE INDEX "Activo_rfid_key" ON "Activo"("rfid");

-- CreateIndex
CREATE INDEX "Activo_categoria_idx" ON "Activo"("categoria");

-- CreateIndex
CREATE INDEX "Activo_ubicacion_idx" ON "Activo"("ubicacion");

-- CreateIndex
CREATE INDEX "Activo_estado_idx" ON "Activo"("estado");

-- CreateIndex
CREATE INDEX "Activo_responsable_idx" ON "Activo"("responsable");

-- CreateIndex
CREATE INDEX "MovimientoActivo_activoId_fecha_idx" ON "MovimientoActivo"("activoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAlmacen_folio_key" ON "ItemAlmacen"("folio");

-- CreateIndex
CREATE INDEX "MovimientoAlmacen_itemId_fecha_idx" ON "MovimientoAlmacen"("itemId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Acta_folio_key" ON "Acta"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_folio_key" ON "Solicitud"("folio");

-- CreateIndex
CREATE INDEX "Auditoria_fecha_idx" ON "Auditoria"("fecha");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioNombre_idx" ON "Auditoria"("usuarioNombre");

-- CreateIndex
CREATE INDEX "Auditoria_modulo_idx" ON "Auditoria"("modulo");

-- AddForeignKey
ALTER TABLE "MovimientoActivo" ADD CONSTRAINT "MovimientoActivo_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAlmacen" ADD CONSTRAINT "MovimientoAlmacen_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemAlmacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudItem" ADD CONSTRAINT "SolicitudItem_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
