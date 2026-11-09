/**
 * Estilo "tablero de investigación": todo ocurre en un tablero oscuro donde se clavan
 * las pruebas de cada escena (fotos en polaroid, notas amarillas, fichas a máquina, sellos,
 * hilo rojo). La cámara recorre el tablero de una escena a la siguiente sin cortes.
 * Arriba, la etiqueta del capítulo ("● ARCHIVO 02 · EL CONTEXTO"); abajo, subtítulos grandes
 * de 1-3 palabras con la palabra clave en rojo.
 */
import "@fontsource/special-elite/400.css";
import "@fontsource/poppins/800.css";
import React from "react";
import {
  AbsoluteFill, Audio, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import type { Escena, Imagen, Motion, Palabra, VideoProps } from "./schema";
import { norm } from "./Video";

const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));
const MAQUINA = "'Special Elite', 'Courier New', monospace";
const GRUESA = "Poppins, Inter, sans-serif";
const ROJO = "#E0262F";
const AMARILLO = "#F4D63A";
const PAPEL = "#EFE6D2";

const CAPITULO: Record<Escena["bloque"], string> = {
  gancho: "EL CASO", contexto: "EL CONTEXTO", decision: "LA DECISIÓN",
  consecuencia: "LAS CONSECUENCIAS", aprendizaje: "LA LECCIÓN", cierre: "TU TURNO",
};

// ---------- Geometría del tablero ----------
const SEP_Y = 1150;
const centro = (i: number) => ({ x: i % 2 === 0 ? 900 : 1900, y: 800 + i * SEP_Y });
const ANCHO = 2800;
// Punto de la pantalla donde se centra cada grupo (arriba de los subtítulos)
const PANT = { x: 540, y: 800 };

// Posiciones (relativas al centro del grupo) de las fotos y de las notas
const SLOT_FOTO = [
  { x: -170, y: -140, r: -5 },
  { x: 200, y: 60, r: 4 },
  { x: -120, y: 260, r: 2 },
];
const SLOT_NOTA = [
  { x: 250, y: -300, r: 5 },
  { x: -280, y: 250, r: -4 },
  { x: 230, y: 330, r: 3 },
];

// ---------- Piezas ----------
const Alfiler: React.FC<{ x?: string }> = ({ x = "50%" }) => (
  <div style={{
    position: "absolute", top: -14, left: x, width: 26, height: 26, marginLeft: -13, borderRadius: "50%",
    background: "radial-gradient(circle at 35% 35%, #ff6b6b, #b3121b 60%, #5a0a0e)", boxShadow: "0 4px 6px rgba(0,0,0,0.55)",
  }} />
);

/** Aparición: cae sobre el tablero (escala y sombra) */
const usarEntrada = (desde: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (desde <= 0) return { s: 1, o: 1 };
  const p = spring({ frame: f - desde, fps, config: { damping: 13, mass: 0.7 } });
  return { s: interpolate(p, [0, 1], [1.35, 1]), o: interpolate(f - desde, [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) };
};

const Polaroid: React.FC<{ img: Imagen; x: number; y: number; r: number; desde: number; etiqueta: string; tv?: boolean }> = ({ img, x, y, r, desde, etiqueta, tv }) => {
  const { s, o } = usarEntrada(desde);
  const foto = img.archivo ?? img.url;
  if (!foto) return null;
  if (tv) {
    return (
      <div style={{ position: "absolute", left: x - 270, top: y - 220, width: 540, opacity: o, transform: `rotate(${r}deg) scale(${s})` }}>
        <div style={{ background: "#1b1a18", borderRadius: 28, padding: 26, boxShadow: "0 24px 40px rgba(0,0,0,0.6)", border: "6px solid #3a362f" }}>
          <div style={{ borderRadius: 18, overflow: "hidden", height: 330, position: "relative" }}>
            <Img src={src(foto)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) contrast(1.05)" }} />
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 5px)" }} />
          </div>
          <div style={{ fontFamily: MAQUINA, fontSize: 17, color: "#bdb5a3", marginTop: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{img.credito ?? ""}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: x - 230, top: y - 260, width: 460, opacity: o, transform: `rotate(${r}deg) scale(${s})` }}>
      <div style={{ background: "#F7F3EA", padding: "26px 26px 18px", boxShadow: "0 22px 38px rgba(0,0,0,0.6)", position: "relative" }}>
        <Alfiler />
        <div style={{ height: 400, overflow: "hidden", background: "#222" }}>
          <Img src={src(foto)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: img.filtro === "bn" ? "grayscale(1)" : img.filtro === "sepia" ? "sepia(0.7)" : "saturate(0.9)" }} />
        </div>
        <div style={{ fontFamily: MAQUINA, fontSize: 24, color: "#2b2620", marginTop: 14, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{etiqueta}</div>
        <div style={{ fontFamily: MAQUINA, fontSize: 15, color: "#6d665a", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{img.credito ?? ""}</div>
      </div>
    </div>
  );
};

const NotaAmarilla: React.FC<{ valor: string; texto: string; x: number; y: number; r: number; desde: number }> = ({ valor, texto, x, y, r, desde }) => {
  const { s, o } = usarEntrada(desde);
  return (
    <div style={{ position: "absolute", left: x - 170, top: y - 150, width: 340, minHeight: 300, background: AMARILLO, padding: "34px 28px", opacity: o,
      transform: `rotate(${r}deg) scale(${s})`, boxShadow: "0 18px 30px rgba(0,0,0,0.5)", textAlign: "center" }}>
      <div style={{ fontFamily: GRUESA, fontWeight: 800, fontSize: valor.length > 6 ? 64 : 92, color: "#1a1a1a", lineHeight: 1 }}>{valor}</div>
      <div style={{ fontFamily: GRUESA, fontWeight: 800, fontSize: 28, color: "#1a1a1a", marginTop: 18, textTransform: "uppercase", lineHeight: 1.15 }}>{texto}</div>
    </div>
  );
};

const Ficha: React.FC<{ titulo: string; lineas: string[]; x: number; y: number; r: number; desde: number }> = ({ titulo, lineas, x, y, r, desde }) => {
  const f = useCurrentFrame();
  const { s, o } = usarEntrada(desde);
  // Efecto máquina de escribir
  const total = lineas.join("\n").length;
  const n = desde <= 0 ? total : Math.floor(interpolate(f - desde, [4, 4 + total * 0.9], [0, total], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  let quedan = n;
  return (
    <div style={{ position: "absolute", left: x - 230, top: y - 150, width: 460, background: PAPEL, padding: "26px 30px 30px", opacity: o,
      transform: `rotate(${r}deg) scale(${s})`, boxShadow: "0 18px 30px rgba(0,0,0,0.5)",
      backgroundImage: "repeating-linear-gradient(180deg, transparent 0 39px, rgba(70,110,170,0.25) 39px 41px)" }}>
      <Alfiler x="85%" />
      <div style={{ fontFamily: MAQUINA, fontSize: 28, color: ROJO, textTransform: "uppercase", borderBottom: `3px solid ${ROJO}`, paddingBottom: 6, marginBottom: 12 }}>{titulo}</div>
      {lineas.map((l, i) => {
        const vis = l.slice(0, Math.max(0, quedan));
        quedan -= l.length + 1;
        return <div key={i} style={{ fontFamily: MAQUINA, fontSize: 30, color: "#1f1c18", lineHeight: 1.3, textTransform: "uppercase", minHeight: 39 }}>{vis}</div>;
      })}
    </div>
  );
};

const Sello: React.FC<{ texto: string; x: number; y: number; r: number; desde: number; tam?: number }> = ({ texto, x, y, r, desde, tam = 64 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = desde <= 0 ? 1 : spring({ frame: f - desde, fps, config: { damping: 15, mass: 0.5 } });
  const s = interpolate(p, [0, 1], [2.4, 1]);
  const o = desde <= 0 ? 0.92 : interpolate(f - desde, [0, 3], [0, 0.92], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${r}deg) scale(${s})`, opacity: o,
      border: `7px solid ${ROJO}`, borderRadius: 10, padding: "6px 22px", fontFamily: GRUESA, fontWeight: 800, fontSize: tam, color: ROJO,
      textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: 2, background: "rgba(20,18,15,0.35)", textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>
      {texto}
    </div>
  );
};

const LogoCarta: React.FC<{ archivo: string; x: number; y: number }> = ({ archivo, x, y }) => (
  <div style={{ position: "absolute", left: x - 200, top: y - 90, width: 400, background: "#FFFFFF", padding: "26px 34px", transform: "rotate(-3deg)",
    boxShadow: "0 18px 30px rgba(0,0,0,0.5)", display: "flex", justifyContent: "center" }}>
    <Alfiler />
    <Img src={src(archivo)} style={{ maxHeight: 120, maxWidth: 330, objectFit: "contain" }} />
  </div>
);

const Cinta: React.FC<{ texto: string; x: number; y: number }> = ({ texto, x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%) rotate(-4deg)", background: ROJO, padding: "14px 34px",
    fontFamily: GRUESA, fontWeight: 800, fontSize: 70, color: "#fff", textTransform: "uppercase", whiteSpace: "nowrap", boxShadow: "0 16px 30px rgba(0,0,0,0.55)" }}>
    {texto}
  </div>
);

const limpiar = (t: string) => t.replace(/\[\[|\]\]/g, "");
const marcado = (t: string) => t.match(/\[\[(.+?)\]\]/)?.[1] ?? t;

/** Convierte un gráfico del guion en una pieza del tablero */
const Pieza: React.FC<{ v: Motion; x: number; y: number; r: number; desde: number }> = ({ v, x, y, r, desde }) => {
  switch (v.tipo) {
    case "dato":
      return <NotaAmarilla valor={v.valor} texto={v.etiqueta} x={x} y={y} r={r} desde={desde} />;
    case "contraste":
      return <Ficha titulo="Antes → después" lineas={[`${v.antes.valor}: ${v.antes.texto}`, `${v.despues.valor}: ${v.despues.texto}`]} x={x} y={y} r={r} desde={desde} />;
    case "iconos":
      return <Ficha titulo="Pistas" lineas={v.items.map((it) => `• ${it.texto}`)} x={x} y={y} r={r} desde={desde} />;
    case "titulo": {
      const m = marcado(v.texto);
      return m.length <= 18
        ? <Sello texto={m} x={x} y={y} r={r - 8} desde={desde} />
        : <Ficha titulo="Nota" lineas={[limpiar(v.texto)]} x={x} y={y} r={r} desde={desde} />;
    }
  }
};

// ---------- Subtítulos de 1-3 palabras ----------
const Subs: React.FC<{ palabras: Palabra[]; destacar: Set<string> }> = ({ palabras, destacar }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const grupos = React.useMemo(() => {
    const g: Palabra[][] = [];
    let actual: Palabra[] = [];
    for (const p of palabras) {
      actual.push(p);
      if (actual.length >= 3 || /[.,;:!?…]$/.test(p.texto)) { g.push(actual); actual = []; }
    }
    if (actual.length) g.push(actual);
    return g;
  }, [palabras]);
  const g = grupos.find((x) => t >= x[0].inicio - 0.05 && t <= x[x.length - 1].fin + 0.15);
  if (!g) return null;
  const desde = g[0].inicio * fps;
  const pop = interpolate(f - desde, [0, 4], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1300, textAlign: "center", transform: `scale(${pop})` }}>
      {g.map((p, i) => (
        <span key={i} style={{ fontFamily: GRUESA, fontWeight: 800, fontSize: 92, lineHeight: 1.1, color: destacar.has(norm(p.texto)) ? ROJO : "#FFFFFF",
          textShadow: "0 6px 18px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.9)", marginRight: 22, display: "inline-block" }}>
          {p.texto.replace(/[.,;:]$/, "")}
        </span>
      ))}
    </div>
  );
};

const Capitulo: React.FC<{ n: number; nombre: string }> = ({ n, nombre }) => {
  const f = useCurrentFrame();
  const txt = `ARCHIVO ${String(n).padStart(2, "0")} · ${nombre}`;
  // En el primer capítulo el texto está completo desde el cuadro 0 (miniatura)
  const vis = n === 1 ? txt : txt.slice(0, Math.floor(f * 1.6) + 1);
  return (
    <div style={{ position: "absolute", top: 150, left: 70, fontFamily: MAQUINA, fontSize: 34, color: "#F2EEE6", letterSpacing: 2, textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
      <span style={{ color: ROJO, opacity: Math.floor(f / 12) % 2 ? 0.35 : 1 }}>● </span>{vis}
    </div>
  );
};

// ---------- Video ----------
export const TableroVideo: React.FC<VideoProps> = ({ guion, timing, audio, musica }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const destacar = React.useMemo(
    () => new Set(guion.escenas.flatMap((e) => e.destacar.flatMap((d) => d.split(/\s+/).map(norm)))),
    [guion],
  );
  const ini = timing.escenas.map((e) => Math.round(e.inicio * fps));
  const fin = timing.escenas.map((e) => Math.round(e.fin * fps));
  const actual = Math.max(0, ini.reduce((acc, x, i) => (f >= x ? i : acc), 0));
  const logo = guion.logo?.archivo ?? guion.logo?.url;

  // Cámara: viaja al grupo de la escena actual (20 cuadros) y deriva despacio dentro de la escena
  const MOV = 20;
  const pos = (i: number) => centro(i);
  const a = pos(Math.max(0, actual - 1));
  const b = pos(actual);
  const k = actual === 0 ? 1 : interpolate(f - ini[actual], [0, MOV], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const durEsc = Math.max(1, fin[actual] - ini[actual]);
  const deriva = (f - ini[actual]) / durEsc;
  const zoom = interpolate(k, [0, 0.5, 1], [0.92, 0.82, 0.92]) + 0.05 * deriva;
  const cx = a.x + (b.x - a.x) * k + Math.sin(actual + deriva) * 18;
  const cy = a.y + (b.y - a.y) * k + 40 * deriva;
  const rot = Math.sin((f / fps) * 0.6) * 0.6;

  // Hilo rojo entre grupos
  const hilos = guion.escenas.slice(1).map((_, j) => {
    const p = pos(j), q = pos(j + 1);
    const largo = Math.hypot(q.x - p.x, q.y - p.y);
    const dibujo = interpolate(f - ini[j + 1], [0, MOV], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const cpx = (p.x + q.x) / 2 + (j % 2 ? -160 : 160);
    return (
      <path key={j} d={`M ${p.x + 120} ${p.y + 200} Q ${cpx} ${(p.y + q.y) / 2 + 120} ${q.x - 170} ${q.y - 260}`} fill="none" stroke="#B3121B" strokeWidth={5}
        strokeDasharray={largo * 1.4} strokeDashoffset={largo * 1.4 * (1 - dibujo)} style={{ filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.6))" }} />
    );
  });

  return (
    <AbsoluteFill style={{ background: "#14120f", overflow: "hidden" }}>
      {audio && <Audio src={src(audio)} />}
      {musica && <Audio src={src(musica)} volume={0.1} loop />}

      {/* Tablero */}
      <div style={{
        position: "absolute", left: 0, top: 0, width: ANCHO, height: 800 + guion.escenas.length * SEP_Y + 600, transformOrigin: "0 0",
        transform: `translate(${PANT.x - cx * zoom}px, ${PANT.y - cy * zoom}px) scale(${zoom}) rotate(${rot}deg)`,
        backgroundColor: "#2a2620", backgroundImage: `url(${staticFile("tablero/ruido.png")})`, backgroundSize: "512px 512px",
      }}>
        <svg width={ANCHO} height={800 + guion.escenas.length * SEP_Y + 600} style={{ position: "absolute", inset: 0 }}>{hilos}</svg>
        {guion.escenas.map((e, i) => {
          const c = pos(i);
          const d0 = ini[i];
          const durI = Math.max(1, fin[i] - ini[i]);
          const visuales = e.motion ?? [];
          // Las piezas del gancho están desde el cuadro 0; las demás caen al llegar la cámara
          const tFoto = (j: number) => (i === 0 ? 0 : d0 + 6 + j * 8);
          const tNota = (j: number) => d0 + Math.round(MOV + 6 + (j + 0.3) * ((durI - MOV - 12) / Math.max(1, visuales.length)));
          return (
            <React.Fragment key={i}>
              {e.imagenes.map((img, j) => {
                const s = SLOT_FOTO[j % SLOT_FOTO.length];
                const rr = s.r + (random(`${guion.id}-${i}-${j}`) - 0.5) * 3;
                return (
                  <Polaroid key={j} img={img} x={c.x + s.x} y={c.y + s.y} r={rr} desde={tFoto(j) - (i === 0 ? 0 : 0)}
                    etiqueta={j === 0 && e.rotulo ? e.rotulo : `Prueba ${String(i + 1).padStart(2, "0")}-${j + 1}`} tv={(i + j) % 3 === 2} />
                );
              })}
              {i === 0 && logo && <LogoCarta archivo={logo} x={c.x + 40} y={c.y - 470} />}
              {i === 0 && e.titulo && <Cinta texto={e.titulo} x={c.x} y={c.y + 300} />}
              {visuales.map((v, j) => {
                // En el gancho la cinta roja ya dice el título: no se repite como sello
                if (i === 0 && e.titulo && v.tipo === "titulo") return null;
                // Los sellos caen encima de la foto principal; el resto, en su espacio de notas
                const s = v.tipo === "titulo" && marcado(v.texto).length <= 18 ? { x: -60, y: 40, r: 0 }
                  : i === 0 ? { x: 300, y: -260, r: 5 } : SLOT_NOTA[j % SLOT_NOTA.length];
                return <Pieza key={`v${j}`} v={v} x={c.x + s.x} y={c.y + s.y} r={s.r} desde={i === 0 ? Math.max(1, tNota(j)) : tNota(j)} />;
              })}
            </React.Fragment>
          );
        })}
      </div>

      {/* Viñeta y capítulo */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, transparent 45%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
      <Sequence from={ini[actual]} durationInFrames={Math.max(1, fin[actual] - ini[actual])} key={`cap${actual}`}>
        <Capitulo n={actual + 1} nombre={CAPITULO[guion.escenas[actual].bloque]} />
      </Sequence>
      <Subs palabras={timing.palabras} destacar={destacar} />
    </AbsoluteFill>
  );
};
