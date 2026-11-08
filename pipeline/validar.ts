/**
 * Valida guiones antes de subirlos: esquema, duración, fuentes, gráficos e historial.
 *   npx tsx pipeline/validar.ts guiones/<id>.json [...]
 * Sale con código 1 si algún guion tiene errores.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { guionSchema } from "../src/schema";
import { sinEtiquetas } from "../src/timing";

const RAIZ = path.resolve(__dirname, "..");

async function main() {
  const archivos = process.argv.slice(2);
  const historial: { id: string; tema: string }[] = JSON.parse(await readFile(path.join(RAIZ, "temas/historial.json"), "utf8"));
  let fallos = 0;
  for (const a of archivos) {
    const errores: string[] = [];
    const avisos: string[] = [];
    let crudo: unknown;
    try { crudo = JSON.parse(await readFile(a, "utf8")); } catch (e) { errores.push(`JSON inválido: ${(e as Error).message}`); }
    const r = crudo ? guionSchema.safeParse(crudo) : null;
    if (r && !r.success) errores.push(...r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
    if (r?.success) {
      const g = r.data;
      if (path.basename(a, ".json") !== g.id) errores.push(`el archivo debe llamarse ${g.id}.json`);
      const palabras = sinEtiquetas(g.escenas.map((e) => e.narracion).join(" ")).split(/\s+/).length;
      const etiquetas = g.escenas.flatMap((e) => e.narracion.match(/\[[^\]]*\]/g) ?? []);
      if (etiquetas.length > 10) avisos.push(`${etiquetas.length} etiquetas de voz: más de 10 suele sonar sobreactuado`);
      const malas = etiquetas.filter((t) => !/^\[[a-z ]{2,30}\]$/.test(t));
      if (malas.length) errores.push(`etiquetas de voz mal escritas (deben ir en inglés, minúsculas, entre corchetes): ${malas.join(" ")}`);
      if (palabras < 95 || palabras > 180) errores.push(`${palabras} palabras de narración (objetivo 100-170, ≈40-60 s)`);
      // Gancho: frase corta y portada obligatoria
      const gancho = g.escenas.find((e) => e.bloque === "gancho");
      const primera = sinEtiquetas(gancho?.narracion ?? "").split(/(?<=[.!?…])\s/)[0] ?? "";
      const nPrimera = primera.split(/\s+/).filter(Boolean).length;
      if (nPrimera > 12) avisos.push(`gancho: la primera frase tiene ${nPrimera} palabras (máx. 10): "${primera}"`);
      if (!gancho?.titulo) errores.push("el gancho necesita `titulo`: es la portada del video (2-5 palabras, idealmente con el número)");
      else if (gancho.titulo.length > 40) avisos.push(`portada larga (${gancho.titulo.length} caracteres): mejor 2-5 palabras`);
      // Cierre corto: solo la pregunta + "Te leo en los comentarios."
      const cierre = sinEtiquetas(g.escenas.filter((e) => e.bloque === "cierre").map((e) => e.narracion).join(" "));
      if (/síguenos/i.test(cierre)) errores.push("el cierre no lleva \"síguenos\" en la voz: va solo en el caption");
      const nCierre = cierre.split(/\s+/).filter(Boolean).length;
      if (nCierre > 15) errores.push(`cierre de ${nCierre} palabras (máx. 15): solo la pregunta + "Te leo en los comentarios."`);
      if (g.escenas.some((e) => /lecci[oó]n es esta/i.test(e.narracion))) errores.push('frase fija prohibida: "La lección es esta"');
      const orden = ["gancho", "contexto", "decision", "consecuencia", "aprendizaje", "cierre"];
      const bloques: string[] = [...new Set(g.escenas.map((e) => e.bloque as string))];
      if (bloques.join() !== orden.filter((b) => bloques.includes(b)).join() || !orden.every((b) => bloques.includes(b)))
        errores.push(`bloques fuera de orden o incompletos: ${bloques.join(" → ")}`);
      if (g.pilar !== "tecnologia" && g.fuentes.length < 2) errores.push("menos de 2 fuentes: cada dato sobre empresas o personas reales necesita fuente");
      const sinMotion = g.escenas.filter((e) => !e.motion).length;
      if (sinMotion > 1) avisos.push(`${sinMotion} escenas sin gráficos (motion)`);
      if (!g.narrador) errores.push("falta narrador (sebas | john)");
      const repetido = historial.find((h) => h.id !== g.id && (h.id.slice(11) === g.id.slice(11) || h.tema.toLowerCase() === g.tema.toLowerCase()));
      if (repetido) errores.push(`tema ya hecho: ${repetido.id}`);
      for (const [i, e] of g.escenas.entries())
        if (e.rotulo && !e.imagenes.some((im) => im.busqueda.toLowerCase().includes(e.rotulo!.toLowerCase().split(" ")[0])))
          avisos.push(`escena ${i + 1}: rótulo "${e.rotulo}" sin una imagen que lo busque por nombre`);
    }
    if (errores.length) fallos++;
    console.log(`${errores.length ? "✗" : "✓"} ${a}`);
    errores.forEach((e) => console.log(`   error: ${e}`));
    avisos.forEach((w) => console.log(`   aviso: ${w}`));
  }
  process.exit(fallos ? 1 : 0);
}
main();
