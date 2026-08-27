/**
 * Generadores deterministas del seed (docs/12). Todo sale de un PRNG con
 * semilla fija: `pnpm db:seed` produce SIEMPRE los mismos datos, así la
 * demo es reproducible y las capturas del Anexo 2A no caducan.
 *
 * Prohibido (docs/12): RUT válidos, personas reales, dominios reales.
 */

/** PRNG mulberry32: rápido, determinista, suficiente para datos de demo. */
export function crearAzar(semilla) {
  let a = semilla >>> 0
  const siguiente = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    azar: siguiente,
    entero: (min, max) => min + Math.floor(siguiente() * (max - min + 1)),
    de: (lista) => lista[Math.floor(siguiente() * lista.length)],
    probabilidad: (p) => siguiente() < p,
  }
}

/** Dígito verificador EAN-13 (suma ponderada 1/3). */
function digitoVerificador(doce) {
  const suma = doce
    .split('')
    .reduce((acc, digito, i) => acc + Number(digito) * (i % 2 === 0 ? 1 : 3), 0)
  return String((10 - (suma % 10)) % 10)
}

/**
 * EAN-13 ficticio VÁLIDO y único: prefijo + correlativo + verificador.
 * Prefijo 780 (Chile) para los activos del seed; la planilla de
 * importación usa otro prefijo para no chocar con la BD.
 */
export function crearGeneradorEan(prefijo = '780', desde = 100000) {
  let contador = desde
  return () => {
    const doce = `${prefijo}${String(contador++).padStart(12 - prefijo.length, '0')}`
    return doce + digitoVerificador(doce)
  }
}

// --- Nombres chilenos ficticios (docs/12: nada de personas reales) ------

const NOMBRES = [
  'María', 'José', 'Camila', 'Andrés', 'Francisca', 'Diego', 'Valentina', 'Cristóbal',
  'Antonia', 'Matías', 'Javiera', 'Sebastián', 'Catalina', 'Nicolás', 'Fernanda', 'Rodrigo',
  'Constanza', 'Felipe', 'Isidora', 'Gonzalo', 'Daniela', 'Pablo', 'Rocío', 'Ignacio',
]

const APELLIDOS = [
  'Soto', 'Rojas', 'Muñoz', 'Díaz', 'Pérez', 'Contreras', 'Silva', 'Martínez',
  'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya',
  'Flores', 'Espinoza', 'Valenzuela', 'Castillo', 'Tapia', 'Reyes', 'Gutiérrez', 'Castro',
  'Vargas', 'Álvarez', 'Vásquez', 'Sandoval', 'Fernández', 'Carrasco', 'Gómez', 'Cortés',
]

const CARGOS = [
  'Analista administrativo', 'Profesional de apoyo', 'Encargado de oficina de partes',
  'Analista de finanzas', 'Secretaria ejecutiva', 'Técnico informático',
  'Encargado de bodega', 'Profesional de fiscalización', 'Asistente administrativo',
  'Conductor institucional',
]

/** 40 funcionarios ficticios; el primero SIEMPRE es "Funcionario Demo" (portal). */
export function generarFuncionarios(rng) {
  const funcionarios = [{ nombre: 'Funcionario Demo', cargo: 'Funcionario' }]
  const usados = new Set(['Funcionario Demo'])
  while (funcionarios.length < 40) {
    const nombre = `${rng.de(NOMBRES)} ${rng.de(APELLIDOS)} ${rng.de(APELLIDOS)}`
    if (usados.has(nombre)) continue
    usados.add(nombre)
    funcionarios.push({ nombre, cargo: rng.de(CARGOS) })
  }
  return funcionarios
}

// --- Catálogo de tipos de activos (docs/12 §Activos) --------------------
// Cada tipo: modelos concretos, categoría, rango de valor CLP y ubicación
// típica. El teléfono IP va en Equipos computacionales (decisión D-11).

export const TIPOS_ACTIVO = [
  {
    cantidad: 90,
    categoria: 'Equipos computacionales',
    valor: [420000, 950000],
    serie: true,
    mantencion: true,
    modelos: [
      'Notebook Lenovo ThinkPad E14', 'Notebook Lenovo ThinkPad L14',
      'Notebook HP ProBook 440 G9', 'Notebook Dell Latitude 3420',
    ],
    descripcion: 'Equipo portátil para labores institucionales.',
  },
  {
    cantidad: 70,
    categoria: 'Equipos computacionales',
    valor: [90000, 260000],
    serie: true,
    modelos: ['Monitor LG 24"', 'Monitor Samsung 24"', 'Monitor Philips 27"', 'Monitor AOC 24"'],
    descripcion: 'Monitor de escritorio.',
  },
  {
    cantidad: 30,
    categoria: 'Equipos computacionales',
    valor: [380000, 720000],
    serie: true,
    mantencion: true,
    modelos: ['PC de escritorio HP ProDesk 400', 'PC de escritorio Lenovo ThinkCentre M70'],
    descripcion: 'Computador de escritorio.',
  },
  {
    cantidad: 40,
    categoria: 'Equipos computacionales',
    valor: [70000, 140000],
    serie: true,
    modelos: ['Teléfono IP Cisco 8841', 'Teléfono IP Yealink T43U'],
    descripcion: 'Teléfono de escritorio para anexo institucional.',
  },
  {
    cantidad: 25,
    categoria: 'Equipos computacionales',
    valor: [180000, 850000],
    serie: true,
    mantencion: true,
    modelos: ['Impresora HP LaserJet M404', 'Multifuncional Brother MFC-L3750', 'Impresora Epson EcoTank L3250'],
    descripcion: 'Equipo de impresión institucional.',
  },
  {
    cantidad: 60,
    categoria: 'Mobiliario',
    valor: [90000, 260000],
    modelos: ['Escritorio de melamina 120 cm', 'Escritorio ejecutivo con cajonera', 'Escritorio en L 150 cm'],
    descripcion: 'Escritorio de trabajo.',
  },
  {
    cantidad: 80,
    categoria: 'Mobiliario',
    valor: [60000, 220000],
    modelos: ['Silla ergonómica con apoyabrazos', 'Silla de escritorio tapizada', 'Silla de visita'],
    descripcion: 'Silla de oficina.',
  },
  {
    cantidad: 30,
    categoria: 'Mobiliario',
    valor: [70000, 190000],
    modelos: ['Estante metálico 5 bandejas', 'Librero de melamina', 'Estante archivador'],
    descripcion: 'Mueble de almacenamiento.',
  },
  {
    cantidad: 20,
    categoria: 'Mobiliario',
    valor: [55000, 120000],
    modelos: ['Cajonera móvil 3 cajones', 'Cajonera metálica con llave'],
    descripcion: 'Cajonera de escritorio.',
  },
  {
    cantidad: 10,
    categoria: 'Mobiliario',
    valor: [180000, 450000],
    modelos: ['Mesa de reuniones 8 personas', 'Mesa de reuniones redonda'],
    descripcion: 'Mesa para sala de reuniones.',
  },
  {
    cantidad: 15,
    categoria: 'Equipos audiovisuales',
    valor: [280000, 750000],
    serie: true,
    modelos: ['Proyector Epson PowerLite X49', 'Proyector ViewSonic PA503'],
    descripcion: 'Proyector para sala de reuniones.',
  },
  {
    cantidad: 10,
    categoria: 'Equipos audiovisuales',
    valor: [150000, 480000],
    serie: true,
    modelos: ['Cámara de videoconferencia Logitech', 'Barra de sonido para videoconferencia'],
    descripcion: 'Equipamiento de videoconferencia.',
  },
  {
    cantidad: 15,
    categoria: 'Equipos de aire y refrigeración',
    valor: [350000, 1200000],
    serie: true,
    mantencion: true,
    modelos: ['Aire acondicionado split 12000 BTU', 'Aire acondicionado split 18000 BTU'],
    descripcion: 'Equipo de climatización.',
  },
  {
    cantidad: 15,
    categoria: 'Herramientas',
    valor: [45000, 320000],
    modelos: ['Taladro percutor inalámbrico', 'Kit de herramientas eléctricas', 'Escalera telescópica de aluminio'],
    descripcion: 'Herramienta de mantención.',
  },
  {
    cantidad: 8,
    categoria: 'Instalaciones',
    valor: [400000, 2500000],
    modelos: ['Tablero eléctrico de distribución', 'Cierre perimetral modular', 'Rack de comunicaciones 42U'],
    descripcion: 'Instalación fija institucional.',
  },
  {
    cantidad: 5,
    categoria: 'Maquinaria',
    valor: [900000, 6500000],
    serie: true,
    mantencion: true,
    modelos: ['Generador eléctrico 6.5 kVA', 'Compactadora de documentos'],
    descripcion: 'Maquinaria de apoyo.',
  },
  {
    cantidad: 3,
    categoria: 'Vehículos',
    valor: [9500000, 19500000],
    serie: true,
    mantencion: true,
    modelos: ['Camioneta Toyota Hilux 4x2', 'Furgón Peugeot Partner', 'Sedán Hyundai Accent'],
    descripcion: 'Vehículo institucional.',
  },
]

export const MARCAS_POR_DEFECTO = ['Institucional', 'Genérico']

/** Ubicaciones (docs/12): 18 pisos/áreas de Huérfanos 1376 + bodegas + archivo. */
export const AREAS_HUERFANOS = [
  'Piso 1, Oficina de partes', 'Piso 1, Atención de público', 'Piso 2, Administración y Finanzas',
  'Piso 2, Tesorería', 'Piso 3, Fiscalía', 'Piso 3, Gabinete', 'Piso 4, Intendencia de Beneficios',
  'Piso 4, Intendencia de Seguridad', 'Piso 5, Tecnologías de la Información', 'Piso 5, Comunicaciones',
  'Piso 6, Recursos Humanos', 'Piso 6, Capacitación', 'Piso 7, Estudios', 'Piso 7, Auditoría interna',
  'Piso 8, Dirección', 'Piso 8, Sala de consejo', 'Subterráneo, Estacionamientos', 'Subterráneo, Sala de servidores',
]
