import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import type { Palabra } from "./schema";

/**
 * Acabado de edición del estilo documental: desenfoque de movimiento en los barridos, destellos de luz
 * en los cambios de escena, una corrección de color común a todas las fotos y la música que baja
 * cuando habla el narrador.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ─────────────── Desenfoque de movimiento (solo horizontal, como un barrido de cámara) ─────────────── */

const NIVELES = [4, 8, 12, 16, 22, 28, 36, 44];

/** Filtros SVG que usan los barridos. Va una sola vez en la raíz del video. */
export const FiltrosMovimiento: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      {NIVELES.map((n) => (
        <filter key={n} id={`mbx${n}`} x="-10%" y="0%" width="120%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${n} 0`} />
        </filter>
      ))}
    </defs>
  </svg>
);

/** `filter` CSS para un desenfoque horizontal de unos `px` píxeles (0 = sin filtro). */
export const desenfoqueX = (px: number) => {
  if (px < 3) return undefined;
  const n = NIVELES.reduce((a, b) => (Math.abs(b - px) < Math.abs(a - px) ? b : a));
  return `url(#mbx${n})`;
};

/** Curva de un barrido: arranca y frena rápido, con la velocidad máxima en el medio. */
export const barrido = (p: number) => Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, p)));
/** Velocidad relativa del barrido en `p` (0 en los extremos, 1 en el medio). */
export const velocidad = (p: number) => Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, p))));

/** Salida de un plano: en sus últimos `t` cuadros se va hacia la izquierda con desenfoque de movimiento. */
export const Salida: React.FC<{ desde: number; t: number; activa: boolean; children: React.ReactNode }> = ({ desde, t, activa, children }) => {
  const f = useCurrentFrame();
  if (!activa || f < desde) return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = (f - desde) / t;
  return (
    <AbsoluteFill style={{ transform: `translateX(${-barrido(p) * 320}px)`, filter: desenfoqueX(velocidad(p) * 40) }}>
      {children}
    </AbsoluteFill>
  );
};

/* ─────────────── Destello de luz en los cambios de escena ─────────────── */

const LUCES = ["255,168,82", "255,120,90", "255,206,120"];

export const Destello: React.FC<{ seed: string; dur?: number }> = ({ seed, dur = 16 }) => {
  const f = useCurrentFrame();
  if (f > dur) return null;
  const p = f / dur;
  const o = interpolate(p, [0, 0.3, 1], [0, 1, 0], clamp);
  const x = interpolate(p, [0, 1], [-20, 120]);
  const y = 25 + random(seed + "y") * 50;
  const c = LUCES[Math.floor(random(seed + "c") * LUCES.length)];
  return (
    <AbsoluteFill style={{
      mixBlendMode: "screen", opacity: o, pointerEvents: "none",
      background: `radial-gradient(ellipse 70% 85% at ${x}% ${y}%, rgba(${c},1) 0%, rgba(${c},0.5) 35%, rgba(${c},0) 75%)`,
    }} />
  );
};

/* ─────────────── Corrección de color común ─────────────── */

/** Sombras frías y luces cálidas, suave: une fotos de distintas épocas y cámaras. */
export const Grade: React.FC = () => (
  <>
    <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.4, background: "linear-gradient(165deg, rgba(0,92,128,0.9) 0%, rgba(0,60,90,0.5) 40%, rgba(255,150,70,0.55) 100%)" }} />
    <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: 0.08, background: "#0a2a3a" }} />
  </>
);

/* ─────────────── Música que baja cuando habla el narrador ─────────────── */

/** Volumen de la música cuadro a cuadro: más baja bajo la voz y sube en las pausas. */
export const volumenMusica = (palabras: Palabra[], fps: number, total: number, base = 0.18) => {
  // Intervalos de voz (palabras pegadas con menos de 0,25 s entre sí se unen)
  const tramos: [number, number][] = [];
  for (const p of palabras) {
    const u = tramos[tramos.length - 1];
    if (u && p.inicio - u[1] < 0.25) u[1] = Math.max(u[1], p.fin);
    else tramos.push([p.inicio, p.fin]);
  }
  return (f: number) => {
    const t = f / fps;
    let d = Infinity;
    for (const [a, b] of tramos) {
      if (t >= a && t <= b) { d = 0; break; }
      d = Math.min(d, t < a ? a - t : t - b);
    }
    const pausa = tramos.length ? interpolate(d, [0.05, 0.4], [0, 1], clamp) : 1;
    const env = interpolate(f, [0, 12, total - 30, total], [0, 1, 1, 0], clamp);
    return base * (0.72 + 0.62 * pausa) * env;
  };
};
