/**
 * Resuelve las imágenes de un guion: busca en Wikimedia Commons (o Pexels),
 * filtra por licencia libre, descarga a public/img/<id>/ y escribe en el guion
 * archivo + crédito + licencia + página de origen, para que puedas revisarlas.
 *
 *   npx tsx pipeline/imagenes.ts guiones/<id>.json [--rehacer]
 *
 * Solo se usan licencias que permiten uso comercial con atribución:
 * dominio público, CC0, CC BY y CC BY-SA. El crédito sale en pantalla.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { guionSchema, type Guion, type Imagen } from "../src/schema";

const RAIZ = path.resolve(__dirname, "..");
try { process.loadEnvFile(path.join(RAIZ, ".env")); } catch { /* opcional */ }
const UA = "content-automation/0.1 (video pipeline; contact via GitHub JohnRodriguezM)";

const LIBRE = /^(public domain|pd|cc0|cc[- ]by(-sa)?( \d\.\d)?)/i;
const limpiarHtml = (s = "") => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Nombre de autor corto y limpio: sin "(en:User:...)", sin "Self-made image submitted by", máx. 50 caracteres. */
const acortarAutor = (a: string) => {
  let x = a.replace(/\([^)]*\)?/g, "").replace(/^(self-made image )?(submitted |uploaded )?by /i, "").replace(/\s+/g, " ").trim();
  if (x.length > 50) x = x.slice(0, 50).replace(/\s+\S*$/, "") + "…";
  return x || "Autor desconocido";
};

type Candidato = Required<Pick<Imagen, "url" | "credito" | "licencia" | "pagina">>;

async function buscarCommons(q: string, usadas: Set<string>, esLogo = false): Promise<Candidato | null> {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({
    action: "query", format: "json", generator: "search", gsrnamespace: "6",
    gsrsearch: esLogo ? q : `${q} filetype:bitmap`, gsrlimit: "15",
    prop: "imageinfo", iiprop: "url|extmetadata|mime|size", // Anchos estándar de Wikimedia (960, 1280…): ya están en caché. Un ancho no estándar como 1600 obliga a generar la
    // miniatura en el momento, y a los bots les responden 429 con mucha más frecuencia.
    iiurlwidth: esLogo ? "960" : "1280",
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await pedir(u);
  if (!r.ok) throw new Error(`Commons ${r.status}`);
  const pages = Object.values((await r.json()).query?.pages ?? {}) as any[];
  pages.sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !(esLogo ? /svg|png/ : /jpeg|png/).test(ii.mime) || (!esLogo && ii.width < 900)) continue;
    const m = ii.extmetadata ?? {};
    const lic = limpiarHtml(m.LicenseShortName?.value);
    if (!LIBRE.test(lic)) continue;
    const url = ii.thumburl ?? ii.url;
    if (usadas.has(url)) continue;
    const autor = limpiarHtml(m.Artist?.value) || "Autor desconocido";
    return {
      url,
      credito: `Foto: ${acortarAutor(autor)} · ${lic} · Wikimedia Commons`,
      licencia: lic,
      pagina: ii.descriptionurl,
    };
  }
  return null;
}

async function buscarPexels(q: string, usadas: Set<string>): Promise<Candidato | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const u = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=10`;
  const r = await fetch(u, { headers: { Authorization: key } });
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  for (const ph of (await r.json()).photos ?? []) {
    const url = ph.src.large2x;
    if (usadas.has(url)) continue;
    return { url, credito: `Foto: ${ph.photographer} / Pexels`, licencia: "Pexels License", pagina: ph.url };
  }
  return null;
}

const existe = (f: string) => access(f).then(() => true, () => false);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch con reintentos: Commons responde 429 si se le pide muy rápido. */
async function pedir(url: string | URL, init: RequestInit = {}, intentos = 5): Promise<Response> {
  const inicio = Date.now();
  for (let i = 0; ; i++) {
    const r = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(30_000) });
    // Commons limita por ráfagas. Se espera Retry-After pero nunca más de 20 s por intento ni 90 s en total por archivo:
    // con un Retry-After largo, una sola imagen llegó a frenar el job 12 minutos y el render se pasó del límite de 45.
    if ((r.status === 429 || r.status >= 500) && i < intentos - 1 && Date.now() - inicio < 90_000) {
      const ra = Number(r.headers.get("retry-after"));
      await esperar(Math.min(20_000, Number.isFinite(ra) && ra > 0 ? ra * 1000 : 2500 * 2 ** Math.min(i, 3)));
      continue;
    }
    return r;
  }
}

/**
 * Descarga una foto de Commons. Si la miniatura de 1280 sigue en 429 después de los reintentos, prueba la de 960
 * (otra caché) y luego el original: con varios renders en paralelo, la de 1280 se quedaba sin bajar y la escena
 * terminaba con una foto repetida.
 */
async function descargar(url: string): Promise<Response> {
  const variantes = [url];
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/thumb(\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/(\d+)px-[^/]+$/);
  if (m) {
    if (m[3] !== "960") variantes.push(url.replace(/\/\d+px-([^/]+)$/, "/960px-$1"));
    variantes.push(m[1] + m[2]);
  }
  let r!: Response;
  for (const v of variantes) {
    r = await pedir(v, {}, v === url ? 5 : 3);
    if (r.ok) return r;
  }
  return r;
}

export async function resolverImagenes(g: Guion, rehacer = false, guardar?: () => Promise<void>): Promise<Guion> {
  const dir = path.join(RAIZ, "public", "img", g.id);
  await mkdir(dir, { recursive: true });
  const usadas = new Set(g.escenas.flatMap((e) => e.imagenes.map((i) => i.url).filter(Boolean) as string[]));
  // Búsqueda repetida en el guion (p. ej. el cierre vuelve a la foto del gancho): si no hay otra foto, se reusa la misma
  const yaResueltas = new Map<string, Imagen>();
  for (const [i, e] of g.escenas.entries()) {
    for (const [j, img] of e.imagenes.entries()) {
      const rel = `img/${g.id}/${i + 1}-${j + 1}.jpg`;
      if (!rehacer && img.archivo && (await existe(path.join(RAIZ, "public", img.archivo)))) continue;
      try {
      if (rehacer || !img.url) {
        const c = img.fuente === "pexels"
          ? (await buscarPexels(img.busqueda, usadas)) ?? (await buscarCommons(img.busqueda, usadas))
          : (await buscarCommons(img.busqueda, usadas)) ?? (await buscarPexels(img.busqueda, usadas));
        const previa = yaResueltas.get(img.busqueda);
        if (!c && previa?.archivo) {
          Object.assign(img, { url: previa.url, credito: previa.credito, licencia: previa.licencia, pagina: previa.pagina, archivo: previa.archivo });
          console.log(`  ${i + 1}.${j + 1} ${img.busqueda} → misma foto que antes`);
          continue;
        }
        if (!c) { console.warn(`  ⚠ escena ${i + 1}.${j + 1}: sin resultados para "${img.busqueda}"`); continue; }
        Object.assign(img, c);
        usadas.add(c.url);
      }
      const r = await descargar(img.url!);
      if (!r.ok) { console.warn(`  ⚠ escena ${i + 1}.${j + 1}: descarga ${r.status}`); continue; }
      await writeFile(path.join(RAIZ, "public", rel), Buffer.from(await r.arrayBuffer()));
      img.archivo = rel;
      yaResueltas.set(img.busqueda, img);
      console.log(`  ${i + 1}.${j + 1} ${img.busqueda} → ${img.pagina}`);
      await guardar?.();
      await esperar(900);
      } catch (err) {
        console.warn(`  ⚠ escena ${i + 1}.${j + 1} (${img.busqueda}): ${(err as Error).message}`);
      }
    }
  }
  // Logo de la portada (SVG de Commons se descarga ya convertido a PNG)
  if (g.logo && (rehacer || !g.logo.archivo || !(await existe(path.join(RAIZ, "public", g.logo.archivo))))) {
    try {
      if (!g.logo.url) {
        const c = await buscarCommons(g.logo.busqueda, new Set(), true);
        if (c) Object.assign(g.logo, c);
      }
      if (g.logo.url) {
        const r = await pedir(g.logo.url);
        if (r.ok) {
          const rel = `img/${g.id}/logo.png`;
          await writeFile(path.join(RAIZ, "public", rel), Buffer.from(await r.arrayBuffer()));
          g.logo.archivo = rel;
          console.log(`  logo ${g.logo.busqueda} → ${g.logo.pagina ?? g.logo.url}`);
          await guardar?.();
        } else console.warn(`  ⚠ logo: descarga ${r.status}`);
      } else console.warn(`  ⚠ logo: sin resultados para "${g.logo.busqueda}"`);
    } catch (err) { console.warn(`  ⚠ logo: ${(err as Error).message}`); }
  }
  return g;
}

if (require.main === module) {
  (async () => {
    const archivo = process.argv[2];
    const g = guionSchema.parse(JSON.parse(await readFile(archivo, "utf8")));
    const guardar = () => writeFile(archivo, JSON.stringify(g, null, 2) + "\n");
    await resolverImagenes(g, process.argv.includes("--rehacer"), guardar);
    await guardar();
    const faltan = g.escenas.flatMap((e, i) => e.imagenes.map((im, j) => (im.archivo ? null : `${i + 1}.${j + 1} "${im.busqueda}"`))).filter(Boolean);
    if (faltan.length) console.warn(`⚠ sin imagen: ${faltan.join(", ")}. Cambia la búsqueda o pega una url y vuelve a correr.`);
    console.log(`✓ imágenes resueltas en ${archivo}`);
  })().catch((e) => { console.error(e); process.exit(1); });
}
