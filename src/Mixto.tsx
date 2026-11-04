import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { M } from "./iconos";
import { TemaCtx, VisualMotion } from "./Motion";
import { EscenaView, Rotulo, Subtitulos, Textura, Titulo, norm } from "./Video";
import type { Escena, VideoProps } from "./schema";

/**
 * Formato mixto: fotos reales como base (documental) y gráficos animados (motion)
 * encima en la segunda parte de cada escena, sobre la foto oscurecida.
 */

const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));
const ACENTOS = [M.red, M.blue, M.yellow, M.green];
const TEMA_FOTO = { texto: "#FFFFFF", sombra: "0 4px 22px rgba(0,0,0,0.75)" };
const PROP_FOTO = 0.42; // parte de la escena que se ve la foto limpia

/** Oscurece y desenfoca la foto mientras está el gráfico. */
const Velo: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, dur - 6, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "rgba(12,11,16,0.66)", opacity: o }} />;
};

/** Salida suave del gráfico antes del cambio. */
const Salida: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(f, [dur - 6, dur], [0, -30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${y}px)` }}>{children}</AbsoluteFill>;
};

const Capas: React.FC<{ e: Escena; dur: number; idx: number }> = ({ e, dur, idx }) => {
  const acento = ACENTOS[idx % ACENTOS.length];
  const visuales = e.motion ?? [];
  const limpio = visuales.length ? Math.round(dur * PROP_FOTO) : dur;
  const tramo = visuales.length ? Math.floor((dur - limpio) / visuales.length) : 0;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={limpio}>
        {e.titulo && <Titulo texto={e.titulo} />}
        {e.rotulo && <Rotulo texto={e.rotulo} />}
      </Sequence>
      {visuales.length > 0 && (
        <Sequence from={limpio} durationInFrames={dur - limpio}>
          <Velo dur={dur - limpio} />
        </Sequence>
      )}
      {visuales.map((v, j) => {
        const d = j === visuales.length - 1 ? dur - limpio - j * tramo : tramo;
        return (
          <Sequence key={j} from={limpio + j * tramo} durationInFrames={d}>
            <Salida dur={d}>
              <AbsoluteFill style={{ padding: "0 140px 0 70px", justifyContent: "center", alignItems: "center", paddingBottom: 560, paddingTop: 200 }}>
                <VisualMotion v={v} acento={acento} />
              </AbsoluteFill>
            </Salida>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const MixtoVideo: React.FC<VideoProps> = ({ guion, timing, audio, musica }) => {
  const { fps } = useVideoConfig();
  const destacar = React.useMemo(
    () => new Set(guion.escenas.flatMap((e) => e.destacar.flatMap((d) => d.split(/\s+/).map(norm)))),
    [guion],
  );
  const rango = (i: number) => {
    const from = Math.round(timing.escenas[i].inicio * fps);
    return { from, dur: Math.max(1, Math.round(timing.escenas[i].fin * fps) - from) };
  };
  return (
    <TemaCtx.Provider value={TEMA_FOTO}>
      <AbsoluteFill style={{ background: "#000" }}>
        {audio && <Audio src={src(audio)} />}
        {musica && <Audio src={src(musica)} volume={0.1} loop />}
        {guion.escenas.map((e, i) => {
          const { from, dur } = rango(i);
          return (
            <Sequence key={i} from={from} durationInFrames={dur + (i < guion.escenas.length - 1 ? 6 : 0)}>
              <EscenaView e={e} dur={dur} idx={i} />
            </Sequence>
          );
        })}
        <Textura />
        {guion.escenas.map((e, i) => {
          const { from, dur } = rango(i);
          return (
            <Sequence key={`c${i}`} from={from} durationInFrames={dur}>
              <Capas e={e} dur={dur} idx={i} />
            </Sequence>
          );
        })}
        <Subtitulos palabras={timing.palabras} destacar={destacar} top={1330} />
      </AbsoluteFill>
    </TemaCtx.Provider>
  );
};
