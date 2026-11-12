/**
 * Genera una sola vez la librería de sonidos del estilo documental (efectos + música de tensión)
 * con ElevenLabs y la guarda en public/sonidos/. Se corre desde GitHub Actions (generar-sonidos.yml),
 * que tiene las claves; los archivos quedan en el repo y los videos los reutilizan sin gastar créditos.
 *
 *   npx tsx pipeline/sonidos.ts [--rehacer]
 */
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const RAIZ = path.resolve(__dirname, "..");
try { process.loadEnvFile(path.join(RAIZ, ".env")); } catch { /* en Actions vienen del entorno */ }
const DIR = path.join(RAIZ, "public", "sonidos");
const CLAVE = process.env.ELEVENLABS_API_KEY_JOHN ?? process.env.ELEVENLABS_API_KEY_SEBAS;
const rehacer = process.argv.includes("--rehacer");
const existe = (f: string) => access(f).then(() => true, () => false);

const EFECTOS: { archivo: string; texto: string; segundos: number }[] = [
  { archivo: "whoosh.mp3", texto: "Fast cinematic whoosh transition, airy swish passing by, clean, no reverb tail", segundos: 0.8 },
  { archivo: "swish.mp3", texto: "Quick subtle soft swoosh, light air movement, short and clean", segundos: 0.5 },
  { archivo: "impacto.mp3", texto: "Deep cinematic impact hit with a low boom, documentary trailer accent, short decay", segundos: 1.6 },
  { archivo: "papel.mp3", texto: "Newspaper clipping slapped onto a wooden table with a short paper rustle", segundos: 1.0 },
  { archivo: "maquina.mp3", texto: "Old mechanical typewriter typing a few fast keystrokes, close and dry", segundos: 1.2 },
  { archivo: "ping.mp3", texto: "Soft digital map location ping, short sonar blip, clean UI sound", segundos: 0.7 },
  { archivo: "obturador.mp3", texto: "Analog camera shutter click, single, crisp", segundos: 0.5 },
  { archivo: "subida.mp3", texto: "Short tense cinematic riser swelling up and cutting to silence", segundos: 2.0 },
  { archivo: "caja.mp3", texto: "Cash register cha-ching with coins, short, retro", segundos: 1.0 },
];

const MUSICA = {
  archivo: "musica-tension.mp3",
  texto:
    "Instrumental dark investigative documentary underscore for narration. Low pulsing synth bass, " +
    "subtle ticking clock percussion, sparse low piano notes, steady suspense, no melody hooks, no vocals, " +
    "constant energy from start to end, 95 bpm, mixed quietly so a voice can sit on top.",
  ms: 90_000,
};

async function pedir(url: string, cuerpo: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": CLAVE!, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 300)}`);
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  if (!CLAVE) throw new Error("Falta ELEVENLABS_API_KEY_JOHN o ELEVENLABS_API_KEY_SEBAS");
  await mkdir(DIR, { recursive: true });
  for (const e of EFECTOS) {
    const f = path.join(DIR, e.archivo);
    if (!rehacer && (await existe(f))) { console.log(`= ${e.archivo} (ya existe)`); continue; }
    const audio = await pedir("https://api.elevenlabs.io/v1/sound-generation", {
      text: e.texto, duration_seconds: e.segundos, prompt_influence: 0.6,
    });
    await writeFile(f, audio);
    console.log(`✓ ${e.archivo} (${(audio.length / 1024).toFixed(0)} KB)`);
  }
  const fm = path.join(DIR, MUSICA.archivo);
  if (rehacer || !(await existe(fm))) {
    try {
      const audio = await pedir("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
        prompt: MUSICA.texto, music_length_ms: MUSICA.ms, force_instrumental: true,
      });
      await writeFile(fm, audio);
      console.log(`✓ ${MUSICA.archivo} con Eleven Music (${(audio.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      // Sin acceso a la API de música: un fondo de tensión en bucle con efectos de sonido
      console.log(`! Eleven Music no disponible (${(err as Error).message}); uso un bucle de 30 s`);
      const audio = await pedir("https://api.elevenlabs.io/v1/sound-generation", {
        text: "Seamless dark documentary tension underscore loop: low pulsing synth drone with soft ticking clock, steady, no melody",
        duration_seconds: 30, prompt_influence: 0.5, loop: true,
      });
      await writeFile(fm, audio);
      console.log(`✓ ${MUSICA.archivo} en bucle (${(audio.length / 1024).toFixed(0)} KB)`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
