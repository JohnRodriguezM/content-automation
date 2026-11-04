import "@fontsource/inter/500.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { Icono, M } from "./iconos";
import type { Escena, Motion as MotionV, Palabra, VideoProps } from "./schema";

const FONT = "Inter, sans-serif";

/** Tema del texto: oscuro sobre crema (motion puro) o blanco sobre foto (mixto). */
export const TemaCtx = React.createContext({ texto: M.ink, sombra: "none" });
const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));
const ACENTOS = [M.red, M.blue, M.yellow, M.green];

const useResorte = (delay = 0, dur = 18) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, durationInFrames: dur, config: { damping: 12, mass: 0.6 } });
};

/** Texto que entra palabra por palabra; [[palabra]] con marcador de color. */
const TextoCinetico: React.FC<{ texto: string; size: number; delay?: number; acento: string; centrado?: boolean }> = ({ texto, size, delay = 0, acento, centrado = true }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tema = React.useContext(TemaCtx);
  const tokens = texto.split(/(\[\[.+?\]\][?!.,:]*)|\s+/).filter(Boolean);
  let k = 0;
  return (
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: -2, color: tema.texto, textShadow: tema.sombra, textAlign: centrado ? "center" : "left" }}>
      {tokens.map((tk, i) => {
        const marcado = tk.startsWith("[[");
        const cierre = marcado ? tk.slice(tk.indexOf("]]") + 2) : "";
        const palabras = marcado ? [tk.slice(2, tk.indexOf("]]"))] : [tk];
        return palabras.map((w) => {
          const d = delay + k++ * 3;
          const s = spring({ frame: f - d, fps, durationInFrames: 14, config: { damping: 11, mass: 0.5 } });
          const barra = interpolate(f - d - 6, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <span key={`${i}${w}`} style={{ display: "inline-block", marginRight: size * 0.22, opacity: s, transform: `translateY(${(1 - s) * 40}px) rotate(${(1 - s) * -4}deg)`, position: "relative" }}>
              {marcado && <span style={{ position: "absolute", left: -8, right: -8, bottom: size * 0.08, height: size * 0.42, background: acento, transform: `scaleX(${barra})`, transformOrigin: "left", zIndex: -1, borderRadius: 6 }} />}
              {w}
              {cierre && <span style={{ position: "absolute", left: "100%" }}>{cierre}</span>}
            </span>
          );
        });
      })}
    </div>
  );
};

const Contador: React.FC<{ valor: string; delay?: number; size: number; color: string }> = ({ valor, delay = 0, size, color }) => {
  const f = useCurrentFrame();
  const m = valor.match(/^([^\d]*)([\d.,]+)(.*)$/);
  const p = interpolate(f - delay, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3) });
  let txt = valor;
  if (m) {
    const limpio = m[2].replace(/[.,](?=\d{3}\b)/g, "");
    const n = parseFloat(limpio.replace(",", "."));
    if (!Number.isNaN(n) && n >= 10) {
      const actual = Math.round(n * p);
      const conMiles = /[.,]\d{3}\b/.test(m[2]);
      txt = `${m[1]}${conMiles ? actual.toLocaleString("es-CO") : actual}${m[3]}`;
    }
  }
  const s = useResorte(delay, 16);
  return <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -6, color, lineHeight: 0.95, transform: `scale(${0.6 + 0.4 * s})` }}>{txt}</div>;
};

const Anillo: React.FC<{ progreso: number; color: string; delay?: number }> = ({ progreso, color, delay = 0 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f - delay, [0, 30], [0, progreso], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3) });
  const r = 250, c = 2 * Math.PI * r;
  return (
    <svg width="600" height="600" viewBox="0 0 600 600" style={{ position: "absolute" }}>
      <circle cx="300" cy="300" r={r} fill="none" stroke={M.gray} strokeWidth="34" opacity={0.5} />
      <circle cx="300" cy="300" r={r} fill="none" stroke={color} strokeWidth="34" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 300 300)" />
    </svg>
  );
};

export const VisualMotion: React.FC<{ v: MotionV; acento: string }> = ({ v, acento }) => {
  const f = useCurrentFrame();
  const tema = React.useContext(TemaCtx);
  const { durationInFrames } = useVideoConfig();
  const t = useResorte(0, 20);
  switch (v.tipo) {
    case "titulo":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 50 }}>
          {v.icono && <Icono nombre={v.icono} t={t} f={f} size={380} />}
          <TextoCinetico texto={v.texto} size={v.texto.length > 34 ? 92 : 116} delay={6} acento={acento} />
        </div>
      );
    case "dato":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <div style={{ position: "relative", width: 600, height: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {v.progreso !== undefined && <Anillo progreso={v.progreso} color={acento} delay={4} />}
            {v.icono && v.progreso === undefined ? <Icono nombre={v.icono} t={t} f={f} size={460} fondo={acento} /> : <Contador valor={v.valor} delay={4} size={v.valor.length > 5 ? 150 : 200} color={tema.texto} />}
          </div>
          {v.icono && v.progreso === undefined && <Contador valor={v.valor} delay={8} size={v.valor.length > 5 ? 150 : 190} color={tema.texto} />}
          <TextoCinetico texto={v.etiqueta} size={60} delay={14} acento={acento} />
        </div>
      );
    case "iconos": {
      const n = v.items.length;
      const paso = Math.floor(durationInFrames / (n + 0.5));
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 40, width: "100%" }}>
          {v.items.map((it, i) => {
            const d = i * Math.min(paso, 40);
            const s = spring({ frame: f - d, fps: 30, durationInFrames: 18, config: { damping: 12, mass: 0.6 } });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 36, opacity: s, transform: `translateX(${(1 - s) * -80}px)` }}>
                <div style={{ width: 250, height: 250, borderRadius: 40, background: ACENTOS[i % ACENTOS.length], border: `6px solid ${M.ink}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icono nombre={it.icono} t={s} f={f} size={210} />
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, lineHeight: 1.05, color: tema.texto, textShadow: tema.sombra, letterSpacing: -1 }}>{it.texto}</div>
              </div>
            );
          })}
        </div>
      );
    }
    case "contraste": {
      const mitad = Math.floor(durationInFrames * 0.45);
      const s2 = spring({ frame: f - mitad, fps: 30, durationInFrames: 18, config: { damping: 12, mass: 0.6 } });
      const Bloque = ({ x, s, color, d, fondoIcono }: { x: typeof v.antes; s: number; color: string; d: number; fondoIcono: string }) => (
        <div style={{ display: "flex", alignItems: "center", gap: 36, opacity: s, transform: `scale(${0.7 + 0.3 * s})`, background: M.paper, border: `6px solid ${M.ink}`, borderRadius: 40, padding: "36px 40px", boxShadow: `14px 14px 0 ${M.ink}` }}>
          <Icono nombre={x.icono} t={s} f={f} size={230} fondo={fondoIcono} />
          <div>
            <Contador valor={x.valor} delay={d} size={120} color={color === M.yellow ? M.ink : color} />
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: M.ink, lineHeight: 1.1, marginTop: 10 }}>{x.texto}</div>
          </div>
        </div>
      );
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 60, width: "100%" }}>
          <Bloque x={v.antes} s={t} color={M.blue} d={0} fondoIcono={M.blue} />
          <div style={{ alignSelf: "center", fontFamily: FONT, fontWeight: 900, fontSize: 90, color: tema.texto, opacity: s2, transform: `rotate(${90 * s2}deg)` }}>→</div>
          <Bloque x={v.despues} s={s2} color={M.red} d={mitad} fondoIcono={M.yellow} />
        </div>
      );
    }
  }
};

/** Barrido de color al entrar cada escena. */
const Barrido: React.FC<{ color: string }> = ({ color }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 7, 14], [-110, 0, 110], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f > 14) return null;
  return <AbsoluteFill style={{ background: color, transform: `translateX(${x}%) skewX(-8deg)`, zIndex: 10 }} />;
};

const Fondo: React.FC<{ acento: string }> = ({ acento }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: M.cream, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${M.gray} 3px, transparent 3px)`, backgroundSize: "56px 56px", opacity: 0.55, transform: `translateY(${(f * 0.6) % 56}px)` }} />
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: acento, opacity: 0.13, right: -420, top: -300, transform: `scale(${1 + Math.sin(f / 40) * 0.05})` }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: acento, opacity: 0.1, left: -320, bottom: 120 }} />
    </AbsoluteFill>
  );
};

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
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]/gu, "");

const Subtitulos: React.FC<{ palabras: Palabra[]; destacar: Set<string> }> = ({ palabras, destacar }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const grupos = React.useMemo(() => agrupar(palabras), [palabras]);
  const g = grupos.find((g) => t >= g[0].inicio - 0.05 && t < g[g.length - 1].fin + 0.12);
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: 1390, display: "flex", justifyContent: "center" }}>
      <div style={{ background: M.ink, borderRadius: 22, padding: "16px 30px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 14px" }}>
        {g.map((p, i) => {
          const activa = t >= p.inicio - 0.02 && t < p.fin + 0.05;
          const clave = destacar.has(norm(p.texto));
          return (
            <span key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: clave ? M.yellow : M.paper, opacity: t >= p.inicio - 0.02 ? 1 : 0.4, transform: activa ? "scale(1.06)" : "none", display: "inline-block" }}>
              {p.texto.replace(/[.,;:]$/, "")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const EscenaMotion: React.FC<{ e: Escena; dur: number; idx: number }> = ({ e, dur, idx }) => {
  const acento = ACENTOS[idx % ACENTOS.length];
  const visuales: MotionV[] = e.motion ?? [{ tipo: "titulo", texto: e.titulo ?? e.narracion.split(/[.?!]/)[0].slice(0, 60) }];
  const tramo = Math.floor(dur / visuales.length);
  return (
    <AbsoluteFill>
      <Fondo acento={acento} />
      {visuales.map((v, j) => (
        <Sequence key={j} from={j * tramo} durationInFrames={j === visuales.length - 1 ? dur - j * tramo : tramo}>
          <AbsoluteFill style={{ padding: "0 80px 0 70px", paddingRight: 140, justifyContent: "center", alignItems: "center", paddingBottom: 420, paddingTop: 160 }}>
            <VisualMotion v={v} acento={acento} />
          </AbsoluteFill>
        </Sequence>
      ))}
      {e.rotulo && (
        <div style={{ position: "absolute", top: 150, left: 70, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: M.paper, background: M.ink, padding: "10px 24px", borderRadius: 999 }}>{e.rotulo}</div>
      )}
      <Barrido color={acento} />
    </AbsoluteFill>
  );
};

export const MotionVideo: React.FC<VideoProps> = ({ guion, timing, audio, musica }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const f = useCurrentFrame();
  const destacar = React.useMemo(
    () => new Set(guion.escenas.flatMap((e) => e.destacar.flatMap((d) => d.split(/\s+/).map(norm)))),
    [guion],
  );
  return (
    <AbsoluteFill style={{ background: M.cream }}>
      {audio && <Audio src={src(audio)} />}
      {musica && <Audio src={src(musica)} volume={0.1} loop />}
      {guion.escenas.map((e, i) => {
        const from = Math.round(timing.escenas[i].inicio * fps);
        const dur = Math.max(1, Math.round(timing.escenas[i].fin * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <EscenaMotion e={e} dur={dur} idx={i} />
          </Sequence>
        );
      })}
      <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${(f / durationInFrames) * 100}%`, background: M.ink }} />
      <Subtitulos palabras={timing.palabras} destacar={destacar} />
    </AbsoluteFill>
  );
};
