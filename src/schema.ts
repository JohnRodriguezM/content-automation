import { z } from "zod";
import { NOMBRES_ICONOS } from "./iconos";

/**
 * Una imagen de la escena. Se escribe `busqueda` (y opcionalmente `fuente`);
 * pipeline/imagenes.ts la resuelve y completa `archivo`, `credito` y `licencia`.
 */
export const imagenSchema = z.object({
  busqueda: z.string().describe("Qué buscar, en inglés si es un tema internacional"),
  fuente: z.enum(["commons", "pexels"]).default("commons"),
  // relleno: foto centrada sobre su propia versión desenfocada (fotos horizontales o de archivo)
  // completa: la foto cubre toda la pantalla (fotos verticales o b-roll)
  modo: z.enum(["relleno", "completa"]).default("relleno"),
  filtro: z.enum(["ninguno", "bn", "sepia"]).default("ninguno"),
  // Estilo documental: si la foto es de una persona, su nombre y cargo en un rótulo (ej. "Michel Olmi" / "cofundador de D1")
  persona: z.object({ nombre: z.string().max(40), cargo: z.string().max(40) }).optional(),
  // Se completan solos al resolver:
  url: z.string().url().optional(),
  archivo: z.string().optional(),
  credito: z.string().optional(),
  licencia: z.string().optional(),
  pagina: z.string().url().optional(),
});

/** Visual de la versión motion 2D (opcional; si falta, se usa la narración como título). */
const iconoSchema = z.enum(NOMBRES_ICONOS);
export const motionSchema = z.discriminatedUnion("tipo", [
  // Frase grande con [[palabra]] resaltada; ícono opcional encima
  z.object({ tipo: z.literal("titulo"), texto: z.string().max(70), icono: iconoSchema.optional() }),
  // Número que cuenta hasta su valor. `progreso` (0-1) dibuja un anillo.
  z.object({ tipo: z.literal("dato"), valor: z.string().max(10), etiqueta: z.string().max(50), icono: iconoSchema.optional(), progreso: z.number().min(0).max(1).optional() }),
  // 1-3 íconos con texto, aparecen uno tras otro
  z.object({ tipo: z.literal("iconos"), items: z.array(z.object({ icono: iconoSchema, texto: z.string().max(36) })).min(1).max(3) }),
  // Antes → después
  z.object({
    tipo: z.literal("contraste"),
    antes: z.object({ valor: z.string().max(10), texto: z.string().max(40), icono: iconoSchema }),
    despues: z.object({ valor: z.string().max(10), texto: z.string().max(40), icono: iconoSchema }),
  }),
  // Estilo documental: mapa con puntos (claves de src/lugares.ts) y una ruta animada entre ellos
  z.object({
    tipo: z.literal("mapa"),
    puntos: z.array(z.object({ lugar: z.string(), etiqueta: z.string().max(32) })).min(1).max(4),
    ruta: z.boolean().default(true),
  }),
  // Estilo documental: cita textual con su autor y dónde la dijo (solo citas reales, copiadas de la fuente)
  z.object({
    tipo: z.literal("cita"),
    texto: z.string().max(120),
    autor: z.string().max(70),
  }),
  // Estilo documental: recorte de prensa con un titular REAL (verificado), medio y fecha
  z.object({
    tipo: z.literal("recorte"),
    medio: z.string().max(40),
    fecha: z.string().max(24),
    titular: z.string().max(150),
    resaltar: z.string().max(80).optional(),
  }),
]);

export const escenaSchema = z.object({
  bloque: z.enum(["gancho", "contexto", "decision", "consecuencia", "aprendizaje", "cierre"]),
  narracion: z.string().min(1),
  // 1-6 imágenes; en el tablero caen una tras otra (más imágenes = escenas más dinámicas)
  imagenes: z.array(imagenSchema).min(1).max(6),
  // Palabras de la narración que salen en serif dorada en los subtítulos
  destacar: z.array(z.string()).default([]),
  // Título grande sobre la imagen (solo en el gancho, normalmente)
  titulo: z.string().max(60).optional(),
  // Rótulo con el nombre de la persona/empresa en pantalla
  rotulo: z.string().max(40).optional(),
  // Estilo documental:
  // contador → barra arriba en el gancho con el logo y una cifra que cuenta ("2.850" tiendas)
  contador: z.object({ valor: z.string().max(12), etiqueta: z.string().max(30).optional() }).optional(),
  // segun → etiqueta de fuente al arrancar la escena ("según Forbes")
  segun: z.string().max(40).optional(),
  // fecha → marca en la línea de tiempo que avanza a lo largo del video ("OCT. 2016", "2025")
  fecha: z.string().max(16).optional(),
  // Versión motion: 1-3 visuales que se reparten la escena
  motion: z.array(motionSchema).min(1).max(3).optional(),
  // Estilo documental: orden de los planos, "f" = siguiente foto, "p" = siguiente pieza (ej. "pfpf").
  // Si falta, se intercalan foto, pieza, foto… Lo que sobre se agrega al final.
  orden: z.string().regex(/^[fp]+$/).optional(),
});

export const guionSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/),
  pilar: z.enum(["negocios", "biografias", "tecnologia"]),
  // Cuenta de ElevenLabs que pone la voz; --narrador o NARRADOR la reemplazan
  narrador: z.enum(["sebas", "john"]).optional(),
  // Modelo de ElevenLabs para este guion (por defecto eleven_v4); ELEVENLABS_MODEL lo reemplaza
  modelo_voz: z.string().optional(),
  // Logo de la empresa protagonista: sale en la portada (primer segundo y medio). Mejor fijarlo con `url`
  // (Special:FilePath del archivo de Commons, SVG o PNG) para no traer el logo equivocado.
  logo: imagenSchema.optional(),
  // Portada (JPG para la cuadrícula del perfil). Por defecto: título del gancho sobre la primera foto.
  // texto admite [[palabra]] resaltada; foto = "escena.imagen" (ej. "1.1"); dato = franja roja debajo.
  portada: z.object({
    texto: z.string().max(60).optional(),
    dato: z.string().max(30).optional(),
    foto: z.string().regex(/^\d+\.\d+$/).optional(),
  }).optional(),
  tema: z.string(),
  pregunta_principal: z.string(),
  escenas: z.array(escenaSchema).min(5).max(12),
  caption: z.string().max(1800), // + crédito + hashtags debe quedar bajo 2.200 (Instagram)
  hashtags: z.array(z.string().regex(/^#\S+$/)).min(3).max(10),
  fuentes: z.array(z.object({ afirmacion: z.string(), url: z.string().url() })),
});

export type Imagen = z.infer<typeof imagenSchema>;
export type Motion = z.infer<typeof motionSchema>;
export type Escena = z.infer<typeof escenaSchema>;
export type Guion = z.infer<typeof guionSchema>;
export type GuionEntrada = z.input<typeof guionSchema>;

export type Palabra = { texto: string; inicio: number; fin: number };
export type Timing = {
  duracion: number;
  escenas: { inicio: number; fin: number }[];
  palabras: Palabra[];
};

// efectos: hay librería de sonidos en public/sonidos/ (estilo documental)
// perfil/usuario: foto y @ del narrador para la tarjeta final de "sígueme" (estilo documental)
export type VideoProps = { guion: Guion; timing: Timing; audio: string | null; musica: string | null; efectos?: boolean; perfil?: string | null; usuario?: string | null };
