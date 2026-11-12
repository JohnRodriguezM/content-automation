import "@fontsource/oswald/500.css";
import "@fontsource/oswald/700.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/playfair-display/800.css";
import React from "react";
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, random, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { geoGraticule10, geoInterpolate, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection } from "geojson";
import mundo from "world-atlas/countries-50m.json";
import { LUGARES } from "./lugares";
import { Credito, Textura, norm } from "./Video";
import type { Escena, Imagen, Motion, Palabra, VideoProps } from "./schema";

/**
 * Estilo documental "premium": cambios de plano cada 1,5-2 s alternando fotos de archivo con
 * mapas animados, recortes de prensa, cifras que cuentan y barras. Música de tensión y un efecto
 * de sonido en cada pieza. La escena reparte su tiempo entre fotos y piezas intercaladas.
 */

const W = 1080;
const ROJO = "#E5372B";
const AMARILLO = "#FFD43B";
const PAPEL = "#F3EEE3";
const GRUESA = "Oswald, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Playfair Display', serif";
const T = 6; // cuadros de transición entre planos
const LOGO_CUADROS = 100;

const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const salida = (p: number) => Easing.out(Easing.cubic)(Math.min(1, Math.max(0, p)));

const MUNDO = mundo as unknown as { objects: { countries: never } };
const PAISES = feature(MUNDO as never, MUNDO.objects.countries) as unknown as FeatureCollection;

/** Número dentro de un texto ("US$6.400M", "87 %", "0,90") para contarlo desde cero. */
const leerNumero = (v: string) => {
  const m = v.match(/-?\d[\d.,]*/);
  if (!m) return null;
  const crudo = m[0];
  let dec = 0, n: number;
  if (/,\d{1,2}$/.test(crudo)) { dec = crudo.split(",")[1].length; n = Number(crudo.replace(/\./g, "").replace(",", ".")); }
  else n = Number(crudo.replace(/[.,]/g, ""));
  if (!isFinite(n)) return null;
  const miles = /\d\.\d{3}/.test(crudo);
  const escribir = (x: number) => {
    const t = dec ? x.toFixed(dec).replace(".", ",") : Math.round(x).toString();
    return v.replace(crudo, miles ? t.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : t);
  };
  return { n, escribir, anio: /^(19|20)\d{2}$/.test(crudo) && v.trim() === crudo };
};

const Sfx: React.FC<{ n: string; v?: number; on?: boolean; desde?: number }> = ({ n, v = 0.35, on, desde = 0 }) =>
  on ? <Sequence from={desde} layout="none"><Audio src={staticFile(`sonidos/${n}.mp3`)} volume={v} /></Sequence> : null;

/* ───────────────────────────── Fotos ───────────────────────────── */

const filtroCss = (f: Imagen["filtro"]) =>
  f === "bn" ? "grayscale(1) contrast(1.12)" : f === "sepia" ? "sepia(0.55) contrast(1.05)" : "saturate(0.88) contrast(1.06)";

/** Foto con zoom lento. `fondo`: desenfocada y oscura, detrás de una pieza gráfica. */
const Foto: React.FC<{ img?: Imagen; dur: number; seed: string; fondo?: boolean }> = ({ img, dur, seed, fondo }) => {
  const f = useCurrentFrame();
  const p = f / Math.max(1, dur);
  if (!img || (!img.archivo && !img.url)) return <AbsoluteFill style={{ background: "#0d1117" }} />;
  const s = src(img.archivo ?? img.url!);
  const acercar = random(seed + "z") > 0.3;
  const esc = acercar ? interpolate(p, [0, 1], [1.04, 1.17]) : interpolate(p, [0, 1], [1.17, 1.04]);
  const dx = (random(seed + "x") - 0.5) * 70 * p;
  const filtro = filtroCss(img.filtro);
  if (fondo) {
    return (
      <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -162, top: -288, width: 108, height: 192, transform: "scale(13)", transformOrigin: "0 0", filter: `${filtro} blur(2.5px) brightness(0.33)` }}>
          <Img src={s} style={{ width: 108, height: 192, objectFit: "cover", display: "block" }} />
        </div>
      </AbsoluteFill>
    );
  }
  if (img.modo === "completa") {
    return (
      <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
        <Img src={s} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translateX(${dx}px) scale(${esc})`, filter: filtro }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", left: -162, top: -288, width: 108, height: 192, transform: "scale(13)", transformOrigin: "0 0", filter: `${filtro} blur(3px) brightness(0.42)` }}>
        <Img src={s} style={{ width: 108, height: 192, objectFit: "cover", display: "block" }} />
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "100%", height: 1240, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Img src={s} style={{ width: "100%", height: "100%", objectFit: "contain", transform: `translateX(${dx}px) scale(${esc})`, filter: filtro, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────────── Mapa ───────────────────────────── */

type PiezaMapa = Extract<Motion, { tipo: "mapa" }>;

const Mapa: React.FC<{ v: PiezaMapa; dur: number; efectos?: boolean }> = ({ v, dur, efectos }) => {
  const f = useCurrentFrame();
  const puntos = v.puntos.filter((p) => LUGARES[p.lugar]).map((p) => ({ ...p, c: LUGARES[p.lugar] }));
  const datos = React.useMemo(() => {
    const coords = puntos.map((p) => [p.c[1], p.c[0]] as [number, number]);
    const proj = geoMercator();
    if (coords.length === 1) proj.center(coords[0]).scale(2400).translate([W / 2, 800]);
    else {
      proj.fitExtent([[190, 520], [890, 1120]], { type: "MultiPoint", coordinates: coords });
      if (proj.scale() > 5200) proj.scale(5200).center(proj.invert!([W / 2, 820]) as [number, number]).translate([W / 2, 820]);
    }
    const camino = geoPath(proj);
    const resaltados = new Set(puntos.map((p) => p.c[2]));
    const paises = (PAISES.features as Feature[]).map((ft) => ({ d: camino(ft) ?? "", on: resaltados.has(String(ft.id)) }));
    const rejilla = camino(geoGraticule10()) ?? "";
    const xy = coords.map((c) => proj(c)!);
    const tramos = coords.slice(1).map((b, i) => {
      const interp = geoInterpolate(coords[i], b);
      const pts = Array.from({ length: 81 }, (_, k) => proj(interp(k / 80))!);
      let largo = 0;
      for (let k = 1; k < pts.length; k++) largo += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      return { pts, largo, d: "M" + pts.map((q) => q.map((n) => n.toFixed(1)).join(",")).join("L") };
    });
    return { paises, rejilla, xy, tramos };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  // Tiempos: primer punto al entrar; cada tramo se dibuja y al llegar aparece el siguiente punto
  const ini = 6, fin = Math.max(ini + 10, dur - 14);
  const nT = datos.tramos.length;
  const durT = nT ? (fin - ini) / nT : 0;
  const llegada = (i: number) => (i === 0 ? 2 : ini + durT * i);
  const zoom = interpolate(f, [0, dur], [1, 1.07], clamp);
  return (
    <AbsoluteFill style={{ background: "#0a111c" }}>
      <svg width={W} height={1920} style={{ position: "absolute", transform: `scale(${zoom})`, transformOrigin: "540px 820px" }}>
        <path d={datos.rejilla} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1.2} />
        {datos.paises.map((p, i) => (
          <path key={i} d={p.d} fill={p.on ? "#4a1d19" : "#1b2535"} stroke={p.on ? ROJO : "#33425c"} strokeWidth={p.on ? 2.4 : 1} />
        ))}
        {datos.tramos.map((t, i) => {
          const p = interpolate(f, [ini + durT * i, ini + durT * (i + 1)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
          if (p <= 0) return null;
          const cab = t.pts[Math.min(80, Math.round(p * 80))];
          return (
            <g key={i}>
              <path d={t.d} fill="none" stroke={AMARILLO} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${t.largo}`} strokeDashoffset={t.largo * (1 - p)} style={{ filter: "drop-shadow(0 0 10px rgba(255,212,59,0.7))" }} />
              {p < 1 && <circle cx={cab[0]} cy={cab[1]} r={11} fill="#fff" style={{ filter: "drop-shadow(0 0 12px #fff)" }} />}
            </g>
          );
        })}
        {datos.xy.map(([x, y], i) => {
          const t0 = llegada(i);
          const a = interpolate(f, [t0, t0 + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
          if (a <= 0) return null;
          const pulso = ((f - t0) % 30) / 30;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={14 + pulso * 40} fill="none" stroke={ROJO} strokeWidth={3} opacity={(1 - pulso) * 0.8} />
              <circle cx={x} cy={y} r={14 * a} fill={ROJO} stroke="#fff" strokeWidth={4} />
            </g>
          );
        })}
      </svg>
      {datos.xy.map(([x, y], i) => {
        const t0 = llegada(i);
        const a = interpolate(f, [t0 + 2, t0 + 12], [0, 1], clamp);
        if (a <= 0) return null;
        const izq = x > 640;
        const sx = 540 + (x - 540) * zoom, sy = 820 + (y - 820) * zoom;
        return (
          <div key={i} style={{
            position: "absolute", top: sy - 30, ...(izq ? { right: W - sx + 34 } : { left: sx + 34 }),
            opacity: a, transform: `translateY(${(1 - a) * 14}px)`,
            background: "rgba(5,8,14,0.85)", borderLeft: `6px solid ${ROJO}`, padding: "8px 18px",
            fontFamily: MONO, fontWeight: 500, fontSize: 30, color: "#fff", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap",
          }}>
            {puntos[i].etiqueta}
          </div>
        );
      })}
      {datos.xy.map((_, i) => <Sfx key={i} n="ping" v={0.3} on={efectos} desde={Math.round(llegada(i))} />)}
    </AbsoluteFill>
  );
};

/* ───────────────────────────── Recorte de prensa ───────────────────────────── */

type PiezaRecorte = Extract<Motion, { tipo: "recorte" }>;

const borde = (seed: string) => {
  const arriba = Array.from({ length: 23 }, (_, i) => `${(i / 22) * 100}% ${random(seed + "a" + i) * 2.2}%`);
  const abajo = Array.from({ length: 23 }, (_, i) => `${100 - (i / 22) * 100}% ${100 - random(seed + "b" + i) * 2.6}%`);
  return `polygon(${[...arriba, ...abajo].join(",")})`;
};

const Recorte: React.FC<{ v: PiezaRecorte; dur: number; seed: string }> = ({ v, dur, seed }) => {
  const f = useCurrentFrame();
  const e = salida(f / 10);
  const rot = interpolate(e, [0, 1], [-7, -1.6]);
  const esc = interpolate(f, [0, dur], [1, 1.05], clamp);
  const marca = interpolate(f, [12, 30], [0, 100], clamp);
  const tam = v.titular.length < 70 ? 68 : v.titular.length < 110 ? 58 : 50;
  const i = v.resaltar ? v.titular.toLowerCase().indexOf(v.resaltar.toLowerCase()) : -1;
  const partes = i >= 0 ? [v.titular.slice(0, i), v.titular.slice(i, i + v.resaltar!.length), v.titular.slice(i + v.resaltar!.length)] : [v.titular, "", ""];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 260 }}>
      <div style={{ transform: `translateY(${(1 - e) * 160}px) rotate(${rot}deg) scale(${esc})`, opacity: Math.min(1, f / 4), filter: "drop-shadow(0 28px 40px rgba(0,0,0,0.6))" }}>
        <div style={{ width: 900, background: PAPEL, padding: "58px 56px 64px", clipPath: borde(seed), position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 500, fontSize: 25, color: "#4b4741", textTransform: "uppercase", letterSpacing: 2 }}>
            <span>{v.medio}</span><span>{v.fecha}</span>
          </div>
          <div style={{ height: 3, background: "#1c1a17", margin: "16px 0 26px" }} />
          <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: tam, lineHeight: 1.13, color: "#141210" }}>
            {partes[0]}
            {partes[1] && (
              <span style={{
                backgroundImage: `linear-gradient(${AMARILLO}, ${AMARILLO})`, backgroundRepeat: "no-repeat",
                backgroundSize: `${marca}% 78%`, backgroundPosition: "0 70%", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone",
              }}>{partes[1]}</span>
            )}
            {partes[2]}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────────── Cifras ───────────────────────────── */

const Dato: React.FC<{ valor: string; etiqueta: string }> = ({ valor, etiqueta }) => {
  const f = useCurrentFrame();
  const num = leerNumero(valor);
  const p = salida((f - 2) / 22);
  const mostrado = num && !num.anio ? num.escribir(num.n * p) : valor;
  const tam = valor.length <= 5 ? 250 : valor.length <= 8 ? 196 : 150;
  const entra = salida(f / 8);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 300 }}>
      <div style={{ transform: `scale(${interpolate(entra, [0, 1], [1.25, 1])})`, opacity: entra, textAlign: "center" }}>
        <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: tam, lineHeight: 1, color: "#fff", letterSpacing: -2, textShadow: "0 10px 40px rgba(0,0,0,0.6)" }}>{mostrado}</div>
        <div style={{ height: 12, background: ROJO, width: `${interpolate(f, [6, 20], [0, 100], clamp)}%`, margin: "22px auto 26px" }} />
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 36, color: "#EDE7DA", textTransform: "uppercase", maxWidth: 880, lineHeight: 1.25, letterSpacing: 1 }}>{etiqueta}</div>
      </div>
    </AbsoluteFill>
  );
};

type PiezaContraste = Extract<Motion, { tipo: "contraste" }>;

const Barras: React.FC<{ v: PiezaContraste }> = ({ v }) => {
  const f = useCurrentFrame();
  const a = leerNumero(v.antes.valor), b = leerNumero(v.despues.valor);
  const max = Math.max(Math.abs(a?.n ?? 1), Math.abs(b?.n ?? 1)) || 1;
  const barra = (lado: PiezaContraste["antes"], num: typeof a, color: string, t0: number) => {
    const p = salida((f - t0) / 20);
    const alto = Math.max(0.05, Math.abs(num?.n ?? max) / max) * 560 * p;
    return (
      <div style={{ width: 340, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 900 }}>
        <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: lado.valor.length > 7 ? 70 : 88, color: "#fff", marginBottom: 14, opacity: Math.min(1, p * 2) }}>
          {num && !num.anio ? num.escribir(num.n * p) : lado.valor}
        </div>
        <div style={{ width: 230, height: alto, background: color, boxShadow: "inset -14px 0 0 rgba(0,0,0,0.18)" }} />
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 28, color: "#EDE7DA", marginTop: 18, textAlign: "center", textTransform: "uppercase", lineHeight: 1.2, height: 70 }}>{lado.texto}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 330 }}>
      <div style={{ display: "flex", gap: 60, alignItems: "flex-end", borderBottom: "4px solid rgba(255,255,255,0.5)", paddingBottom: 0 }}>
        {barra(v.antes, a, "#7b8191", 2)}
        {barra(v.despues, b, ROJO, 12)}
      </div>
    </AbsoluteFill>
  );
};

/** Frase grande con [[palabra]] resaltada en una franja roja. */
const Frase: React.FC<{ texto: string }> = ({ texto }) => {
  const f = useCurrentFrame();
  const e = salida(f / 9);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 90px 330px" }}>
      <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: 104, lineHeight: 1.08, color: "#fff", textTransform: "uppercase", textAlign: "center", opacity: e, transform: `translateY(${(1 - e) * 40}px)` }}>
        {texto.split(/(\[\[[^\]]+\]\])/).map((t, i) =>
          t.startsWith("[[")
            ? <span key={i} style={{ background: ROJO, padding: "0 14px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{t.slice(2, -2)}</span>
            : <span key={i}>{t}</span>)}
      </div>
    </AbsoluteFill>
  );
};

const Lista: React.FC<{ items: { texto: string }[]; dur: number }> = ({ items, dur }) => {
  const f = useCurrentFrame();
  const paso = Math.max(8, Math.floor((dur - 10) / items.length));
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 100px 330px" }}>
      {items.map((it, i) => {
        const a = salida((f - i * paso) / 8);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 38, opacity: a, transform: `translateX(${(1 - a) * -60}px)` }}>
            <div style={{ width: 26, height: 26, background: ROJO, flexShrink: 0 }} />
            <div style={{ fontFamily: GRUESA, fontWeight: 500, fontSize: 64, color: "#fff", textTransform: "uppercase", lineHeight: 1.1 }}>{it.texto}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ───────────────────────────── Escena ───────────────────────────── */

type Plano = { tipo: "foto"; img: Imagen; i: number } | { tipo: "pieza"; v: Motion; fondo?: Imagen };

/** Fotos y piezas intercaladas: foto, pieza, foto, pieza… (las que sobren van al final). */
const planos = (e: Escena): Plano[] => {
  const fotos = e.imagenes.map((img, i) => ({ tipo: "foto" as const, img, i }));
  const piezas = e.motion ?? [];
  const orden = e.orden ?? Array.from({ length: Math.max(fotos.length, piezas.length) }, () => "fp").join("");
  const out: Plano[] = [];
  let nf = 0, np = 0;
  // La pieza usa de fondo la última foto mostrada (o la siguiente, si va primero)
  const pieza = () => out.push({ tipo: "pieza", v: piezas[np++], fondo: (fotos[Math.max(0, nf - 1)] ?? fotos[0])?.img });
  for (const c of orden) {
    if (c === "f" && nf < fotos.length) out.push(fotos[nf++]);
    else if (c === "p" && np < piezas.length) pieza();
  }
  while (nf < fotos.length) out.push(fotos[nf++]);
  while (np < piezas.length) pieza();
  return out;
};

const sonidoDe = (p: Plano): [string, number] | null => {
  if (p.tipo === "foto") return ["swish", 0.22];
  switch (p.v.tipo) {
    case "recorte": return ["papel", 0.55];
    case "dato": case "contraste": return ["impacto", 0.4];
    case "mapa": return ["whoosh", 0.3];
    default: return ["swish", 0.25];
  }
};

/** Entrada de cada plano: aparece sobre el anterior con un zoom corto y desenfoque (sin negro entre planos). */
const Entrada: React.FC<{ activa: boolean; children: React.ReactNode }> = ({ activa, children }) => {
  const f = useCurrentFrame();
  if (!activa) return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = salida(f / T);
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, f / (T - 2)), transform: `scale(${interpolate(p, [0, 1], [1.1, 1])})`, filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

const Pieza: React.FC<{ v: Motion; dur: number; seed: string; efectos?: boolean }> = ({ v, dur, seed, efectos }) => {
  switch (v.tipo) {
    case "mapa": return <Mapa v={v} dur={dur} efectos={efectos} />;
    case "recorte": return <Recorte v={v} dur={dur} seed={seed} />;
    case "dato": return <Dato valor={v.valor} etiqueta={v.etiqueta} />;
    case "contraste": return <Barras v={v} />;
    case "titulo": return <Frase texto={v.texto} />;
    case "iconos": return <Lista items={v.items} dur={dur} />;
  }
};

/** Título del gancho: visible desde el cuadro 0 (portada del video). */
const TituloGancho: React.FC<{ texto: string; dur: number; conLogo: boolean }> = ({ texto, dur, conLogo }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: conLogo ? 330 : 250, left: 60, right: 60, textAlign: "center", opacity: o }}>
      <span style={{
        fontFamily: GRUESA, fontWeight: 700, fontSize: texto.length > 24 ? 96 : 116, lineHeight: 1.16, color: "#fff", textTransform: "uppercase",
        background: ROJO, padding: "2px 22px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone",
      }}>{texto}</span>
    </div>
  );
};

/** Lugar y fecha a máquina en la esquina, como en un documental. */
const Rotulo: React.FC<{ texto: string; dur: number }> = ({ texto, dur }) => {
  const f = useCurrentFrame();
  const letras = Math.floor(interpolate(f, [4, 4 + texto.length * 1.2], [0, texto.length], clamp));
  const o = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: 210, left: 60, display: "flex", alignItems: "center", gap: 16, opacity: o }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: ROJO, opacity: f % 30 < 18 ? 1 : 0.3 }} />
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 34, color: "#fff", textTransform: "uppercase", letterSpacing: 2, background: "rgba(0,0,0,0.6)", padding: "6px 14px" }}>
        {texto.slice(0, letras)}
      </div>
    </div>
  );
};

const Logo: React.FC<{ archivo: string; dur: number }> = ({ archivo, dur }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: 110, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ background: "#fff", borderRadius: 22, padding: "16px 30px", boxShadow: "0 10px 36px rgba(0,0,0,0.45)" }}>
        <Img src={src(archivo)} style={{ maxHeight: 120, maxWidth: 520, objectFit: "contain", display: "block" }} />
      </div>
    </div>
  );
};

const EscenaDoc: React.FC<{ e: Escena; dur: number; idx: number; efectos?: boolean; logo?: string }> = ({ e, dur, idx, efectos, logo }) => {
  const ps = planos(e);
  const base = Math.floor(dur / ps.length);
  const conLogo = idx === 0 && Boolean(logo);
  return (
    <AbsoluteFill>
      {ps.map((p, j) => {
        const from = j * base;
        const d = j === ps.length - 1 ? dur - from : base;
        const son = sonidoDe(p);
        const seed = `${idx}-${j}`;
        return (
          <Sequence key={j} from={from} durationInFrames={d + T}>
            <Entrada activa={!(idx === 0 && j === 0)}>
              {p.tipo === "foto" ? (
                <>
                  <Foto img={p.img} dur={d + T} seed={seed} />
                  <Credito texto={p.img.credito} />
                </>
              ) : (
                <>
                  {p.v.tipo !== "mapa" && <Foto img={p.fondo} dur={d + T} seed={seed} fondo />}
                  <Pieza v={p.v} dur={d} seed={seed} efectos={efectos} />
                </>
              )}
            </Entrada>
            {son && !(idx === 0 && j === 0) && <Sfx n={son[0]} v={son[1]} on={efectos} />}
          </Sequence>
        );
      })}
      {e.rotulo && <Sequence durationInFrames={Math.min(dur, 84)}><Rotulo texto={e.rotulo} dur={Math.min(dur, 84)} /><Sfx n="maquina" v={0.2} on={efectos} desde={3} /></Sequence>}
      {conLogo && <Sequence durationInFrames={Math.min(dur, LOGO_CUADROS)}><Logo archivo={logo!} dur={Math.min(dur, LOGO_CUADROS)} /></Sequence>}
      {idx === 0 && e.titulo && <Sequence durationInFrames={Math.min(dur, 80)}><TituloGancho texto={e.titulo} dur={Math.min(dur, 80)} conLogo={conLogo} /></Sequence>}
    </AbsoluteFill>
  );
};

/* ───────────────────────────── Subtítulos ───────────────────────────── */

const agrupar = (palabras: Palabra[]) => {
  const grupos: Palabra[][] = [];
  let g: Palabra[] = [];
  for (const p of palabras) {
    g.push(p);
    if (g.length >= 3 || /[.,;:?!]$/.test(p.texto)) { grupos.push(g); g = []; }
  }
  if (g.length) grupos.push(g);
  return grupos;
};

const Subs: React.FC<{ palabras: Palabra[]; destacar: Set<string> }> = ({ palabras, destacar }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const grupos = React.useMemo(() => agrupar(palabras), [palabras]);
  const g = grupos.find((g) => t >= g[0].inicio - 0.05 && t < g[g.length - 1].fin + 0.1);
  if (!g) return null;
  const pop = interpolate(t - g[0].inicio, [-0.05, 0.08], [0.88, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1330, textAlign: "center", transform: `scale(${pop})` }}>
      {g.map((p, i) => {
        const clave = destacar.has(norm(p.texto));
        return (
          <span key={i} style={{
            display: "inline-block", margin: "0 12px", fontFamily: GRUESA, fontWeight: 700, fontSize: 86, lineHeight: 1.1,
            textTransform: "uppercase", color: clave ? AMARILLO : "#fff", opacity: t >= p.inicio - 0.03 ? 1 : 0.45,
            textShadow: "0 0 3px #000, 0 4px 0 #000, 0 6px 22px rgba(0,0,0,0.9)",
          }}>
            {p.texto.replace(/[.,;:]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/* ───────────────────────────── Video ───────────────────────────── */

export const DocumentalVideo: React.FC<VideoProps> = ({ guion, timing, audio, musica, efectos }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const destacar = React.useMemo(
    () => new Set(guion.escenas.flatMap((e) => e.destacar.flatMap((d) => d.split(/\s+/).map(norm)))),
    [guion],
  );
  const rango = (i: number) => {
    const from = Math.round(timing.escenas[i].inicio * fps);
    return { from, dur: Math.max(1, Math.round(timing.escenas[i].fin * fps) - from) };
  };
  const logo = guion.logo?.archivo ?? guion.logo?.url;
  return (
    <AbsoluteFill style={{ background: "#0a111c" }}>
      {audio && <Audio src={src(audio)} />}
      {musica && (
        <Audio src={src(musica)} loop
          volume={(f) => 0.18 * interpolate(f, [0, 12, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], clamp)} />
      )}
      {guion.escenas.map((e, i) => {
        const { from, dur } = rango(i);
        return (
          <Sequence key={i} from={from} durationInFrames={dur + (i < guion.escenas.length - 1 ? T : 0)}>
            <EscenaDoc e={e} dur={dur} idx={i} efectos={efectos} logo={logo} />
          </Sequence>
        );
      })}
      <Textura />
      <Subs palabras={timing.palabras} destacar={destacar} />
    </AbsoluteFill>
  );
};
