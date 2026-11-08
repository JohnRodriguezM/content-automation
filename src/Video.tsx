import "@fontsource/inter/500.css";
import "@fontsource/inter/800.css";
import "@fontsource/playfair-display/800.css";
import "@fontsource/playfair-display/800-italic.css";
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, random, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import type { Escena, Imagen, Palabra, VideoProps } from "./schema";

const C = { text: "#FFFFFF", gold: "#E8B64C", shadow: "0 3px 14px rgba(0,0,0,0.85)" };
const SANS = "Inter, sans-serif";
const SERIF = "'Playfair Display', serif";
const FADE = 6; // frames de fundido entre planos

const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));

// Cadena vacía (no "none") cuando no hay filtro, para poder concatenar blur/brightness sin invalidar el CSS.
const filtroCss = (f: Imagen["filtro"]) =>
  f === "bn" ? "grayscale(1) contrast(1.08)" : f === "sepia" ? "sepia(0.55) contrast(1.05)" : "";

/** Un plano: foto con zoom lento (Ken Burns) y fundido de entrada. */
export const Plano: React.FC<{ img: Imagen; dur: number; seed: string; sinFundido?: boolean }> = ({ img, dur, seed, sinFundido }) => {
  const frame = useCurrentFrame();
  const p = frame / Math.max(1, dur);
  // Dirección del movimiento distinta en cada plano, pero determinista
  const dx = (random(seed + "x") - 0.5) * 60;
  const dy = (random(seed + "y") - 0.5) * 40;
  const acercar = random(seed + "z") > 0.35;
  const escala = acercar ? interpolate(p, [0, 1], [1.04, 1.16]) : interpolate(p, [0, 1], [1.16, 1.04]);
  const mover = `translate(${dx * p}px, ${dy * p}px) scale(${escala})`;
  // El primer plano del video no hace fundido: el cuadro 0 es la miniatura y debe tener foto.
  const opacity = sinFundido ? 1 : interpolate(frame, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
  const filter = filtroCss(img.filtro);
  if (!img.archivo && !img.url) return <AbsoluteFill style={{ background: "#111", opacity }} />;
  const s = src(img.archivo ?? img.url!);

  if (img.modo === "completa") {
    return (
      <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
        <Img src={s} style={{ width: "100%", height: "100%", objectFit: "cover", transform: mover, filter }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden", background: "#000" }}>
      {/* Fondo desenfocado calculado a 1/10 de resolución y ampliado: mismo look, mucho más rápido de renderizar */}
      <div style={{ position: "absolute", left: -162, top: -288, width: 108, height: 192, transform: "scale(13)", transformOrigin: "0 0", filter: `${filter} blur(3px) brightness(0.45)`.trim(), willChange: "transform" }}>
        <Img src={s} style={{ width: 108, height: 192, objectFit: "cover", display: "block" }} />
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "100%", height: 1180, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Img src={s} style={{ width: "100%", height: "100%", objectFit: "contain", transform: mover, filter }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Crédito de la foto, pequeño y discreto (obligatorio con licencias CC). */
export const Credito: React.FC<{ texto?: string }> = ({ texto }) =>
  texto ? (
    <div style={{ position: "absolute", left: 48, bottom: 330, right: 200, fontFamily: SANS, fontSize: 22, fontWeight: 500, color: "rgba(255,255,255,0.72)", textShadow: C.shadow }}>
      {texto}
    </div>
  ) : null;

export const Titulo: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [4, 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const y = interpolate(frame, [4, 12], [24, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", top: 300, left: 70, right: 70, textAlign: "center", opacity: o, transform: `translateY(${y}px)` }}>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, lineHeight: 1.08, color: C.text, textTransform: "uppercase", letterSpacing: -1, background: "rgba(0,0,0,0.55)", padding: "6px 22px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
        {texto}
      </span>
    </div>
  );
};

export const Rotulo: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", top: 420, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "rgba(10,10,10,0.82)", padding: "14px 30px", borderLeft: `6px solid ${C.gold}`, clipPath: `inset(0 ${100 - w * 100}% 0 0)` }}>
        <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 46, color: C.text }}>{texto}</span>
      </div>
    </div>
  );
};

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]/gu, "");

/** Frases cortas (≤4 palabras o hasta un signo de puntuación). */
const agrupar = (palabras: Palabra[]) => {
  const grupos: Palabra[][] = [];
  let g: Palabra[] = [];
  for (const p of palabras) {
    g.push(p);
    if (g.length >= 4 || /[.,;:?!]$/.test(p.texto)) { grupos.push(g); g = []; }
  }
  if (g.length) grupos.push(g);
  return grupos;
};

export const Subtitulos: React.FC<{ palabras: Palabra[]; destacar: Set<string>; top?: number }> = ({ palabras, destacar, top = 1180 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const grupos = React.useMemo(() => agrupar(palabras), [palabras]);
  const g = grupos.find((g) => t >= g[0].inicio - 0.05 && t < g[g.length - 1].fin + 0.12);
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 150, top, textAlign: "center", lineHeight: 1.12 }}>
      {g.map((p, i) => {
        const dicha = t >= p.inicio - 0.02;
        const clave = destacar.has(norm(p.texto));
        const pop = clave ? interpolate(t - p.inicio, [0, 0.12], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
        return (
          <span key={i} style={{
            display: "inline-block", marginRight: 16, transform: `scale(${pop})`,
            fontFamily: clave ? SERIF : SANS,
            fontStyle: clave ? "italic" : "normal",
            fontWeight: 800,
            fontSize: clave ? 84 : 60,
            color: clave ? C.gold : C.text,
            opacity: dicha ? 1 : 0.35,
            textShadow: C.shadow,
          }}>
            {p.texto.replace(/[.,;:]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/** Grano de película + viñeta: da textura "documental" y unifica fotos de distintas fuentes. */
export const Textura: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill style={{
        opacity: 0.07, mixBlendMode: "overlay",
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        backgroundPosition: `${(frame * 37) % 240}px ${(frame * 53) % 240}px`,
      }} />
    </>
  );
};

export const EscenaView: React.FC<{ e: Escena; dur: number; idx: number }> = ({ e, dur, idx }) => {
  const n = e.imagenes.length;
  const tramo = Math.floor(dur / n);
  return (
    <AbsoluteFill>
      {e.imagenes.map((img, j) => {
        const from = j * tramo;
        const d = j === n - 1 ? dur - from : tramo + FADE;
        return (
          <Sequence key={j} from={from} durationInFrames={d}>
            <Plano img={img} dur={d} seed={`${idx}-${j}`} sinFundido={idx === 0 && j === 0} />
            <Credito texto={img.credito} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const Video: React.FC<VideoProps> = ({ guion, timing, audio, musica }) => {
  const { fps } = useVideoConfig();
  const destacar = React.useMemo(
    () => new Set(guion.escenas.flatMap((e) => e.destacar.flatMap((d) => d.split(/\s+/).map(norm)))),
    [guion],
  );
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {audio && <Audio src={src(audio)} />}
      {musica && <Audio src={src(musica)} volume={0.1} loop />}
      {guion.escenas.map((e, i) => {
        const { inicio, fin } = timing.escenas[i];
        const from = Math.round(inicio * fps);
        const dur = Math.max(1, Math.round(fin * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur + (i < guion.escenas.length - 1 ? FADE : 0)}>
            <EscenaView e={e} dur={dur} idx={i} />
          </Sequence>
        );
      })}
      <Textura />
      {guion.escenas.map((e, i) => {
        const from = Math.round(timing.escenas[i].inicio * fps);
        const dur = Math.max(1, Math.round(timing.escenas[i].fin * fps) - from);
        return (
          <Sequence key={`o${i}`} from={from} durationInFrames={dur}>
            {e.titulo && <Titulo texto={e.titulo} />}
            {e.rotulo && <Rotulo texto={e.rotulo} />}
          </Sequence>
        );
      })}
      <Subtitulos palabras={timing.palabras} destacar={destacar} />
    </AbsoluteFill>
  );
};
