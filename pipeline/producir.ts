/**
 * Guion JSON → voz (ElevenLabs) → video (Remotion) → post en Zernio.
 *
 *   npx tsx pipeline/producir.ts guiones/<id>.json [opciones]
 *     --sin-voz            render con tiempos estimados, sin gastar créditos
 *     --sin-imagenes       no buscar/descargar imágenes
 *     --rehacer-imagenes   volver a buscar todas las imágenes
 *     --rehacer-voz        regenerar la voz aunque haya caché
 *     --narrador=sebas|john
 *     --estilo=mixto|documental|motion   (por defecto mixto: fotos + gráficos encima)
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
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { guionSchema, type Guion, type Timing, type VideoProps } from "../src/schema";
import { resolverImagenes } from "./imagenes";
import { estimarTiming, textoNarracion, timingDesdeAlineacion, type Alineacion } from "../src/timing";

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

async function voz(g: Guion): Promise<{ timing: Timing; audio: string | null }> {
  if (flag("sin-voz")) return { timing: estimarTiming(g), audio: null };
  const narrador = (flag("narrador") ?? process.env.NARRADOR ?? "sebas").toLowerCase();
  const rel = `audio/${g.id}-${narrador}.mp3`;
  const cache = path.join(PUBLIC, `audio/${g.id}-${narrador}.json`);
  const texto = textoNarracion(g);
  if (!flag("rehacer-voz") && (await existe(cache))) {
    const c = JSON.parse(await readFile(cache, "utf8"));
    if (c.texto === texto) { console.log("  voz en caché (usa --rehacer-voz para regenerar)"); return { timing: c.timing, audio: rel }; }
  }
  const N = narrador.toUpperCase();
  console.log(`  narrador: ${narrador}`);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${env(`ELEVENLABS_VOICE_ID_${N}`)}/with-timestamps`, {
    method: "POST",
    headers: { "xi-api-key": env(`ELEVENLABS_API_KEY_${N}`), "Content-Type": "application/json" },
    body: JSON.stringify({
      text: texto,
      model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
      language_code: "es",
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { audio_base64: string; alignment: Alineacion };
  await mkdir(path.join(PUBLIC, "audio"), { recursive: true });
  await writeFile(path.join(PUBLIC, rel), Buffer.from(data.audio_base64, "base64"));
  const timing = timingDesdeAlineacion(g, data.alignment);
  await writeFile(cache, JSON.stringify({ texto, timing }));
  return { timing, audio: rel };
}

async function render(props: VideoProps, salida: string, id: "Video" | "Motion" | "Mixto") {
  const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src/Root.tsx"), publicDir: PUBLIC });
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const composition = await selectComposition({ serveUrl, id, inputProps: props, browserExecutable });
  await renderMedia({
    composition, serveUrl, codec: "h264", crf: 20, outputLocation: salida, inputProps: props,
    browserExecutable, audioBitrate: "192k",
    onProgress: ({ progress }) => process.stdout.write(`\rRender ${Math.round(progress * 100)}%`),
  });
  process.stdout.write("\n");
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
    content: `${g.caption}\n\n${g.hashtags.join(" ")}`,
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

  const estilo = (flag("estilo") ?? "mixto") as "mixto" | "documental" | "motion";
  if (estilo !== "motion" && !flag("sin-imagenes")) {
    console.log(`→ ${guion.id}: imágenes`);
    const guardar = () => writeFile(ruta, JSON.stringify(guion, null, 2) + "\n");
    await resolverImagenes(guion, Boolean(flag("rehacer-imagenes")), guardar);
    await guardar();
    const faltan = guion.escenas.some((e) => e.imagenes.some((im) => !im.archivo));
    if (faltan) throw new Error("Hay escenas sin imagen. Corre pipeline/imagenes.ts y revisa las búsquedas.");
  }

  console.log("→ voz");
  const { timing, audio } = await voz(guion);
  await writeFile(path.join(OUT, `${guion.id}.timing.json`), JSON.stringify(timing, null, 2));
  console.log(`  ${timing.duracion.toFixed(1)} s, ${timing.palabras.length} palabras`);
  if (timing.duracion > 90) console.warn("  ⚠ más de 90 s: recorta el guion");

  console.log("→ render");
  const sufijo = flag("sin-voz") ? "sin-voz" : (flag("narrador") ?? process.env.NARRADOR ?? "sebas").toLowerCase();
  const video = path.join(OUT, `${guion.id}-${sufijo}-${estilo}.mp4`);
  const musica = (await existe(path.join(PUBLIC, "musica.mp3"))) ? "musica.mp3" : null;
  await render({ guion, timing, audio, musica }, video, { mixto: "Mixto", documental: "Video", motion: "Motion" }[estilo] as "Mixto" | "Video" | "Motion");

  const modo = (flag("publicar") ?? "no") as "borrador" | "programar" | "no";
  if (modo !== "no") {
    console.log(`→ Zernio (${modo})`);
    await publicar(guion, video, modo);
  }
  console.log(`✓ ${video}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
