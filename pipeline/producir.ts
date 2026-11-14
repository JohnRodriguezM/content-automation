/**
 * Guion JSON → voz (ElevenLabs) → video (Remotion) → post en Zernio.
 *
 *   npx tsx pipeline/producir.ts guiones/<id>.json [opciones]
 *     --sin-voz            render con tiempos estimados, sin gastar créditos
 *     --sin-imagenes       no buscar/descargar imágenes
 *     --rehacer-imagenes   volver a buscar todas las imágenes
 *     --rehacer-voz        regenerar la voz aunque haya caché
 *     --narrador=sebas|john
 *     --estilo=tablero|documental|mixto|clasico|motion   (por defecto documental; ESTILO en el entorno también sirve)
 *     --solo-portada       solo imágenes + portada (sin voz ni video); SOLO_PORTADA=1 también sirve
 *     --publicar=borrador|programar|no   --hora=19:30
 *
 * Variables de entorno (en local: archivo .env; en GitHub: Secrets):
 *   NARRADOR (sebas | john) → usa ELEVENLABS_API_KEY_<NARRADOR> y ELEVENLABS_VOICE_ID_<NARRADOR>
 *   ELEVENLABS_MODEL (opcional)
 *   ZERNIO_API_KEY, ZERNIO_TIKTOK_ID, ZERNIO_INSTAGRAM_ID
 *   REMOTION_BROWSER (opcional: ruta a un Chrome/Chromium ya instalado)
 */
import { access, mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { guionSchema, type Guion, type Timing, type VideoProps } from "../src/schema";
import { resolverImagenes } from "./imagenes";
import { estimarTiming, sinEtiquetas, textoNarracion, timingDesdeAlineacion, type Alineacion } from "../src/timing";

const RAIZ = path.resolve(__dirname, "..");
try { process.loadEnvFile(path.join(RAIZ, ".env")); } catch { /* sin .env: se usan las variables del entorno */ }
const OUT = path.join(RAIZ, "out");
const PUBLIC = path.join(RAIZ, "public");

const args = process.argv.slice(2);
const flag = (n: string) => args.find((a) => a.startsWith(`--${n}`))?.split("=")[1] ?? (args.includes(`--${n}`) ? "true" : undefined);
const existe = (f: string) => access(f).then(() => true, () => false);
const env = (n: string) => {
  const v = process.env[n];
  if (!v) throw new Error(`Falta la variable de entorno ${n}`);
  return v;
};

const narradorDe = (g: Guion) => (flag("narrador") ?? g.narrador ?? process.env.NARRADOR ?? "sebas").toLowerCase();

/** Texto listo para pegar en TikTok/Instagram + fuentes y créditos para revisar. */
export function descripcion(g: Guion) {
  const creditos = [...new Set(g.escenas.flatMap((e) => e.imagenes.map((i) => i.credito).filter(Boolean)))];
  const caption = `${g.caption}\n\nFotos: Wikimedia Commons (créditos en el video).\n\n${g.hashtags.join(" ")}`;
  return [
    `TEMA: ${g.tema}`,
    `PILAR: ${g.pilar} · NARRADOR: ${narradorDe(g)}`,
    "",
    "===== CAPTION (TikTok e Instagram) =====",
    caption,
    "",
    `(${caption.length} caracteres · Instagram admite 2.200, TikTok 4.000)`,
    "",
    "===== FUENTES (para revisar, no publicar) =====",
    ...g.fuentes.map((f) => `- ${f.afirmacion}\n  ${f.url}`),
    "",
    "===== CRÉDITOS DE IMÁGENES =====",
    ...creditos.map((c) => `- ${c}`),
    ...g.escenas.flatMap((e) => e.imagenes.map((i) => i.pagina).filter(Boolean)).map((u) => `  ${u}`),
    ...(g.logo?.pagina || g.logo?.url ? [`  Logo: ${g.logo.pagina ?? g.logo.url}`] : []),
  ].join("\n");
}

async function voz(g: Guion): Promise<{ timing: Timing; audio: string | null }> {
  if (flag("sin-voz")) return { timing: estimarTiming(g), audio: null };
  const narrador = narradorDe(g);
  const rel = `audio/${g.id}-${narrador}.mp3`;
  const cache = path.join(PUBLIC, `audio/${g.id}-${narrador}.json`);
  const texto = textoNarracion(g);
  if (!flag("rehacer-voz") && (await existe(cache))) {
    const c = JSON.parse(await readFile(cache, "utf8"));
    if (c.texto === texto && (c.modelo ?? "") === (process.env.ELEVENLABS_MODEL || g.modelo_voz || "eleven_v4")) { console.log("  voz en caché (usa --rehacer-voz para regenerar)"); return { timing: c.timing, audio: rel }; }
  }
  const N = narrador.toUpperCase();
  const voiceId = env(`ELEVENLABS_VOICE_ID_${N}`);
  const key = env(`ELEVENLABS_API_KEY_${N}`);
  const modelo = process.env.ELEVENLABS_MODEL || g.modelo_voz || "eleven_v4";
  const plano = sinEtiquetas(texto);
  console.log(`  narrador: ${narrador} · modelo: ${modelo}`);
  const api = "https://api.elevenlabs.io/v1";
  const json = { "xi-api-key": key, "Content-Type": "application/json" };
  // v3/v4 interpretan las etiquetas ([sighs], [laughs]...). Estabilidad 0.5 = "natural"; similitud alta para no alejarse de la voz clonada.
  const cuerpo = (model_id: string, text: string) =>
    JSON.stringify(model_id.startsWith("eleven_multilingual") || model_id.startsWith("eleven_turbo") || model_id.startsWith("eleven_flash")
      ? { text, model_id, language_code: "es" }
      : { text, model_id, voice_settings: { stability: 0.5, similarity_boost: 0.95, use_speaker_boost: true } });

  let audio: Buffer | null = null;
  let alineacion: Alineacion | null = null;

  // 1) Modelo expresivo con timestamps
  const r1 = await fetch(`${api}/text-to-speech/${voiceId}/with-timestamps`, { method: "POST", headers: json, body: cuerpo(modelo, texto) });
  if (r1.ok) {
    const d = (await r1.json()) as { audio_base64: string; alignment?: Alineacion };
    audio = Buffer.from(d.audio_base64, "base64");
    if (d.alignment?.characters?.length) { alineacion = d.alignment; console.log("  voz: modelo expresivo con timestamps"); }
  } else console.warn(`  ⚠ ${modelo} con timestamps: ${r1.status} ${(await r1.text()).slice(0, 200)}`);

  // 2) Modelo expresivo sin timestamps + alineación forzada sobre el texto sin etiquetas
  if (!audio) {
    const r2 = await fetch(`${api}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, { method: "POST", headers: json, body: cuerpo(modelo, texto) });
    if (r2.ok) audio = Buffer.from(await r2.arrayBuffer());
    else console.warn(`  ⚠ ${modelo}: ${r2.status} ${(await r2.text()).slice(0, 200)}`);
  }
  if (audio && !alineacion) {
    const form = new FormData();
    form.append("file", new Blob([audio], { type: "audio/mpeg" }), "voz.mp3");
    form.append("text", plano);
    const r3 = await fetch(`${api}/forced-alignment`, { method: "POST", headers: { "xi-api-key": key }, body: form });
    if (r3.ok) {
      const d = (await r3.json()) as { characters: { text: string; start: number; end: number }[] };
      alineacion = {
        characters: d.characters.map((c) => c.text),
        character_start_times_seconds: d.characters.map((c) => c.start),
        character_end_times_seconds: d.characters.map((c) => c.end),
      };
      console.log("  voz: modelo expresivo + alineación forzada");
    } else { console.warn(`  ⚠ alineación forzada: ${r3.status} ${(await r3.text()).slice(0, 200)}`); audio = null; }
  }

  // 3) Respaldo: modelo multilingüe sin etiquetas
  if (!audio || !alineacion) {
    console.warn("  ⚠ usando respaldo eleven_multilingual_v2 sin etiquetas");
    const r4 = await fetch(`${api}/text-to-speech/${voiceId}/with-timestamps`, { method: "POST", headers: json, body: cuerpo("eleven_multilingual_v2", plano) });
    if (!r4.ok) throw new Error(`ElevenLabs ${r4.status}: ${await r4.text()}`);
    const d = (await r4.json()) as { audio_base64: string; alignment: Alineacion };
    audio = Buffer.from(d.audio_base64, "base64");
    alineacion = d.alignment;
  }

  await mkdir(path.join(PUBLIC, "audio"), { recursive: true });
  await writeFile(path.join(PUBLIC, rel), audio);
  const timing = timingDesdeAlineacion(g, alineacion);
  await writeFile(cache, JSON.stringify({ texto, timing, modelo }));
  return { timing, audio: rel };
}

/**
 * Acelera la voz sin cambiar el tono (ffmpeg atempo) y escala los tiempos de subtítulos y escenas.
 * VELOCIDAD_VOZ (por defecto 1.12). El audio original queda en caché; esto se rehace en cada render.
 */
function acelerar(audio: string | null, timing: Timing): { audio: string | null; timing: Timing } {
  const f = Number(process.env.VELOCIDAD_VOZ ?? "1.12");
  if (!audio || !(f > 0) || f === 1) return { audio, timing };
  const salida = audio.replace(/\.mp3$/, `-x${Math.round(f * 100)}.mp3`);
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(PUBLIC, audio), "-filter:a", `atempo=${f}`, "-b:a", "192k", path.join(PUBLIC, salida)]);
  } catch (e) {
    console.warn(`  ⚠ no se pudo acelerar la voz (${(e as Error).message.split("\n")[0]}); queda a velocidad normal`);
    return { audio, timing };
  }
  const s = (t: number) => t / f;
  console.log(`  voz acelerada x${f}`);
  return {
    audio: salida,
    timing: {
      duracion: s(timing.duracion),
      escenas: timing.escenas.map((e) => ({ inicio: s(e.inicio), fin: s(e.fin) })),
      palabras: timing.palabras.map((p) => ({ ...p, inicio: s(p.inicio), fin: s(p.fin) })),
    },
  };
}

async function render(props: VideoProps, salida: string, id: "Video" | "Motion" | "Mixto" | "Tablero" | "Documental") {
  const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src/Root.tsx"), publicDir: PUBLIC });
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const composition = await selectComposition({ serveUrl, id, inputProps: props, browserExecutable });
  await renderMedia({
    composition, serveUrl, codec: "h264", crf: id === "Tablero" || id === "Documental" ? 24 : 20, outputLocation: salida, inputProps: props,
    browserExecutable, audioBitrate: "192k",
    onProgress: ({ progress }) => process.stdout.write(`\rRender ${Math.round(progress * 100)}%`),
  });
  process.stdout.write("\n");
}

/** Portada JPG (cuadrícula del perfil): mismo guion, composición Portada, un cuadro. */
async function portada(guion: Guion, salida: string) {
  const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src/Root.tsx"), publicDir: PUBLIC });
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const inputProps: VideoProps = { guion, timing: { duracion: 1, escenas: guion.escenas.map(() => ({ inicio: 0, fin: 1 })), palabras: [] }, audio: null, musica: null };
  const composition = await selectComposition({ serveUrl, id: "Portada", inputProps, browserExecutable });
  await renderStill({ composition, serveUrl, frame: 0, output: salida, inputProps, browserExecutable, imageFormat: "jpeg", jpegQuality: 90 });
  console.log(`✓ portada: ${salida}`);
}

/** Próxima ocurrencia de HH:MM en Bogotá, como fecha local sin zona (Zernio aplica `timezone`). */
function proximaHora(hhmm: string) {
  const ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(ahora);
  d.setHours(h, m, 0, 0);
  if (d <= ahora) d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(h)}:${p(m)}:00`;
}

async function publicar(g: Guion, video: string, modo: "borrador" | "programar") {
  const api = "https://zernio.com/api/v1";
  const auth = { Authorization: `Bearer ${env("ZERNIO_API_KEY")}`, "Content-Type": "application/json" };
  const size = (await stat(video)).size;

  const pre = await fetch(`${api}/media/presign`, {
    method: "POST", headers: auth,
    body: JSON.stringify({ filename: `${g.id}.mp4`, contentType: "video/mp4", size }),
  });
  if (!pre.ok) throw new Error(`Zernio presign ${pre.status}: ${await pre.text()}`);
  const { uploadUrl, publicUrl } = (await pre.json()) as { uploadUrl: string; publicUrl: string };

  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: await readFile(video) });
  if (!put.ok) throw new Error(`Subida del video ${put.status}`);

  const body: Record<string, unknown> = {
    content: `${g.caption}\n\nFotos: Wikimedia Commons (créditos en el video).\n\n${g.hashtags.join(" ")}`,
    mediaItems: [{ type: "video", url: publicUrl }],
    platforms: [
      { platform: "tiktok", accountId: env("ZERNIO_TIKTOK_ID") },
      { platform: "instagram", accountId: env("ZERNIO_INSTAGRAM_ID") },
    ],
    tiktokSettings: {
      privacy_level: "PUBLIC_TO_EVERYONE",
      allow_comment: true, allow_duet: true, allow_stitch: true,
      content_preview_confirmed: true, express_consent_given: true,
    },
  };
  if (modo === "borrador") body.isDraft = true;
  else { body.scheduledFor = proximaHora(flag("hora") ?? "19:30"); body.timezone = "America/Bogota"; }

  const res = await fetch(`${api}/posts`, { method: "POST", headers: { ...auth, "Idempotency-Key": randomUUID() }, body: JSON.stringify(body) });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Zernio posts ${res.status}: ${txt}`);
  const post = JSON.parse(txt).post;
  console.log(`Post ${modo === "borrador" ? "en borrador" : `programado para ${body.scheduledFor} (Bogotá)`}: ${post?._id}`);
  return post?._id as string | undefined;
}

async function main() {
  const archivo = args.find((a) => !a.startsWith("--"));
  if (!archivo) throw new Error("Uso: producir.ts guiones/<id>.json");
  const ruta = path.resolve(archivo);
  const guion = guionSchema.parse(JSON.parse(await readFile(ruta, "utf8")));
  await mkdir(OUT, { recursive: true });

  const estilo = (flag("estilo") ?? process.env.ESTILO ?? "documental") as "mixto" | "documental" | "clasico" | "motion" | "tablero";
  if (estilo !== "motion" && !flag("sin-imagenes")) {
    console.log(`→ ${guion.id}: imágenes`);
    const guardar = () => writeFile(ruta, JSON.stringify(guion, null, 2) + "\n");
    await resolverImagenes(guion, Boolean(flag("rehacer-imagenes")), guardar);
    await guardar();
    // Imágenes sin resultado: se quitan de su escena; si una escena queda vacía, toma la última imagen de la escena anterior (o la siguiente).
    const sinImagen: string[] = [];
    guion.escenas.forEach((e, i) => {
      const buenas = e.imagenes.filter((im) => im.archivo);
      e.imagenes.filter((im) => !im.archivo).forEach((im) => sinImagen.push(`${i + 1}: "${im.busqueda}"`));
      e.imagenes = buenas;
    });
    guion.escenas.forEach((e, i) => {
      if (e.imagenes.length) return;
      const vecina = [...guion.escenas.slice(0, i)].reverse().find((x) => x.imagenes.length) ?? guion.escenas.slice(i + 1).find((x) => x.imagenes.length);
      if (vecina) e.imagenes = [{ ...vecina.imagenes[vecina.imagenes.length - 1] }];
    });
    if (guion.escenas.some((e) => !e.imagenes.length)) throw new Error("Ninguna imagen se pudo resolver. Revisa las búsquedas del guion.");
    if (sinImagen.length) console.warn(`  ⚠ sin imagen (se reemplazaron): ${sinImagen.join(", ")}`);
  }

  await mkdir(OUT, { recursive: true });
  await portada(guion, path.join(OUT, `${guion.id}-portada.jpg`));
  if (flag("solo-portada") || process.env.SOLO_PORTADA === "1") return;

  console.log("→ voz");
  const original = await voz(guion);
  const { timing, audio } = acelerar(original.audio, original.timing);
  await writeFile(path.join(OUT, `${guion.id}.timing.json`), JSON.stringify(timing, null, 2));
  console.log(`  ${timing.duracion.toFixed(1)} s, ${timing.palabras.length} palabras`);
  if (timing.duracion > 90) console.warn("  ⚠ más de 90 s: recorta el guion");

  console.log("→ render");
  const sufijo = flag("sin-voz") ? "sin-voz" : narradorDe(guion);
  const video = path.join(OUT, `${guion.id}-${sufijo}-${estilo}.mp4`);
  await writeFile(path.join(OUT, `${guion.id}-${sufijo}.descripcion.txt`), descripcion(guion) + "\n");
  // El estilo documental trae su propia música de tensión y efectos (public/sonidos/, ver pipeline/sonidos.ts)
  const doc = estilo === "documental";
  const musicaDoc = doc && (await existe(path.join(PUBLIC, "sonidos", "musica-tension.mp3"))) ? "sonidos/musica-tension.mp3" : null;
  const musica = musicaDoc ?? ((await existe(path.join(PUBLIC, "musica.mp3"))) ? "musica.mp3" : null);
  const efectos = doc && (await existe(path.join(PUBLIC, "sonidos", "whoosh.mp3")));
  if (doc) console.log(`  música: ${musica ?? "ninguna"} · efectos: ${efectos ? "sí" : "no"}`);
  const comp = ({ mixto: "Mixto", documental: "Documental", clasico: "Video", motion: "Motion", tablero: "Tablero" } as const)[estilo];
  await render({ guion, timing, audio, musica, efectos }, video, comp);

  const modo = (flag("publicar") ?? "no") as "borrador" | "programar" | "no";
  if (modo !== "no") {
    console.log(`→ Zernio (${modo})`);
    await publicar(guion, video, modo);
  }
  console.log(`✓ ${video}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
