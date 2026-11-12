import "@fontsource/oswald/700.css";
import "@fontsource/ibm-plex-mono/500.css";
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import type { VideoProps } from "./schema";

/**
 * Portada de la serie (1080×1920, un cuadro). Instagram y TikTok muestran el perfil recortado a 3:4
 * (franja central de 1080×1440, de y=240 a y=1680): todo el texto vive dentro de esa franja.
 */

const ROJO = "#E5372B";
const AMARILLO = "#FFD43B";
const GRUESA = "Oswald, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));

const PILARES = {
  negocios: "Negocios por dentro",
  biografias: "Personas detrás de las marcas",
  tecnologia: "Tecnología que cambia negocios",
} as const;

export const Portada: React.FC<VideoProps> = ({ guion }) => {
  const p = guion.portada ?? {};
  const [e, i] = (p.foto ?? "1.1").split(".").map((n) => Number(n) - 1);
  const img = guion.escenas[e]?.imagenes[i] ?? guion.escenas[0].imagenes[0];
  const foto = img?.archivo ?? img?.url;
  const gancho = guion.escenas.find((x) => x.bloque === "gancho");
  const texto = p.texto ?? gancho?.titulo ?? guion.tema;
  const limpio = texto.replace(/\[\[|\]\]/g, "");
  const tam = limpio.length <= 16 ? 176 : limpio.length <= 26 ? 150 : limpio.length <= 40 ? 124 : 104;
  const logo = guion.logo?.archivo ?? guion.logo?.url;
  return (
    <AbsoluteFill style={{ background: "#0a111c" }}>
      {foto && (
        <Img src={src(foto)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.9) contrast(1.08)" }} />
      )}
      {/* Oscurece arriba (etiqueta) y sobre todo abajo (titular) para que el texto se lea en cualquier foto */}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(5,8,14,0.65) 0%, rgba(5,8,14,0) 28%, rgba(5,8,14,0) 42%, rgba(5,8,14,0.88) 70%, rgba(5,8,14,0.95) 100%)" }} />
      <div style={{ position: "absolute", top: 300, left: 70, right: 70, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ background: ROJO, color: "#fff", fontFamily: MONO, fontWeight: 500, fontSize: 30, letterSpacing: 2, textTransform: "uppercase", padding: "10px 18px" }}>
          {PILARES[guion.pilar]}
        </div>
        {logo && (
          <div style={{ background: "#fff", borderRadius: 18, padding: "12px 20px" }}>
            <Img src={src(logo)} style={{ maxHeight: 80, maxWidth: 260, objectFit: "contain", display: "block" }} />
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, bottom: 300 }}>
        <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: tam, lineHeight: 1.02, color: "#fff", textTransform: "uppercase", letterSpacing: -1, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
          {texto.split(/(\[\[[^\]]+\]\])/).map((t, k) =>
            t.startsWith("[[") ? <span key={k} style={{ color: AMARILLO }}>{t.slice(2, -2)}</span> : <span key={k}>{t}</span>)}
        </div>
        {p.dato && (
          <div style={{ display: "inline-block", marginTop: 30, background: ROJO, color: "#fff", fontFamily: GRUESA, fontWeight: 700, fontSize: 64, textTransform: "uppercase", padding: "6px 22px" }}>
            {p.dato}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
