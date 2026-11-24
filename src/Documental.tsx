import "@fontsource/oswald/500.css";
import "@fontsource/oswald/700.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/playfair-display/800.css";
import React from "react";
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, random, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { geoCentroid, geoGraticule10, geoInterpolate, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection } from "geojson";
import mundo from "world-atlas/countries-50m.json";
import { LUGARES } from "./lugares";
import { Barras3D, Globo } from "./Tres";
import { Credito, Textura, norm } from "./Video";
import { Destello, FiltrosMovimiento, Grade, Salida, barrido, desenfoqueX, velocidad, volumenMusica } from "./Efectos";
import { COLA_TARJETA, type Escena, type Imagen, type Motion, type Palabra, type VideoProps } from "./schema";

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
const ADELANTO = 4; // la imagen cambia 4 cuadros antes que la frase: el corte se siente encima de la voz
const LOGO_CUADROS = 100;
const TITULO_CUADROS = 84; // el título del gancho (y el contador) se ven ~2,8 s; mientras tanto no hay subtítulos

const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const salida = (p: number) => Easing.out(Easing.cubic)(Math.min(1, Math.max(0, p)));
/** Rampa de velocidad del zoom: arranca rápido y se asienta, como una cámara que llega. */
const rampa = Easing.bezier(0.12, 0.62, 0.3, 1);

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
  const p = rampa(Math.min(1, f / Math.max(1, dur)));
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
      // Puntos muy cercanos (Dundee-Edimburgo): tope de zoom, centrado en el punto medio de la ruta
      if (proj.scale() > 5200) proj.scale(5200).center(geoCentroid({ type: "MultiPoint", coordinates: coords })).translate([W / 2, 820]);
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
  const trazo = salida((f - 5) / 9) * 100;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 90px 330px" }}>
      <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: 104, lineHeight: 1.08, color: "#fff", textTransform: "uppercase", textAlign: "center", opacity: e, transform: `translateY(${(1 - e) * 40}px)` }}>
        {texto.split(/(\[\[[^\]]+\]\])/).map((t, i) =>
          t.startsWith("[[")
            ? <span key={i} style={{ backgroundImage: `linear-gradient(${ROJO}, ${ROJO})`, backgroundRepeat: "no-repeat", backgroundSize: `${trazo}% 100%`, padding: "0 14px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{t.slice(2, -2)}</span>
            : <span key={i}>{t}</span>)}
      </div>
    </AbsoluteFill>
  );
};

/** Cita textual: grande, entre comillas, con quién la dijo y dónde. */
const Cita: React.FC<{ texto: string; autor: string }> = ({ texto, autor }) => {
  const f = useCurrentFrame();
  const e = salida(f / 9);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px 330px" }}>
      <div style={{ opacity: e, transform: `translateY(${(1 - e) * 30}px)` }}>
        <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: texto.length > 70 ? 70 : 86, lineHeight: 1.1, color: "#fff", textTransform: "uppercase", textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
          “{texto}”
        </div>
        <div style={{ display: "inline-block", marginTop: 30, background: "rgba(8,9,12,0.88)", color: "#fff", fontFamily: MONO, fontWeight: 500, fontSize: 28, padding: "8px 16px", opacity: interpolate(f, [8, 16], [0, 1], clamp) }}>
          {autor}
        </div>
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
  const base = e.orden ?? Array.from({ length: Math.max(fotos.length, piezas.length) }, () => "fp").join("");
  // Con título (gancho): primero las fotos, para que el titular en cajas no quede encima de una pieza gráfica
  const orden = e.titulo ? [...base].sort((a, b) => (a === "f" ? 0 : 1) - (b === "f" ? 0 : 1)).join("") : base;
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
    case "cita": return ["maquina", 0.22];
    case "dato": case "contraste": return ["impacto", 0.4];
    case "mapa": case "globo": return ["whoosh", 0.3];
    case "barras3d": return ["impacto", 0.35];
    default: return ["swish", 0.25];
  }
};

/** Entrada de cada plano: aparece sobre el anterior con un zoom corto y desenfoque (sin negro entre planos). */
const Entrada: React.FC<{ activa: boolean; golpe?: boolean; tipo?: "barrido" | "zoom"; children: React.ReactNode }> = ({ activa, golpe, tipo = "zoom", children }) => {
  const f = useCurrentFrame();
  // Primer plano del video: visible desde el cuadro 0 (es la miniatura mientras la gente hace scroll)
  // pero con un golpe de cámara rápido para que se sienta movimiento desde el primer instante.
  if (golpe) return <AbsoluteFill style={{ transform: `scale(${interpolate(salida(f / 7), [0, 1], [1.16, 1])})` }}>{children}</AbsoluteFill>;
  if (!activa) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (tipo === "barrido") {
    // Barrido de cámara: entra desde la derecha con desenfoque de movimiento mientras el plano anterior se va
    const q = f / T;
    if (q >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
    return <AbsoluteFill style={{ transform: `translateX(${(1 - barrido(q)) * W}px)`, filter: desenfoqueX(velocidad(q) * 44) }}>{children}</AbsoluteFill>;
  }
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
    case "cita": return <Cita texto={v.texto} autor={v.autor} />;
    case "globo": return <Globo desde={v.desde} hasta={v.hasta} etiqueta={v.etiqueta} dur={dur} />;
    case "barras3d": return <Barras3D titulo={v.titulo} items={v.items} dur={dur} />;
  }
};

/** Título del gancho: visible desde el cuadro 0 (portada del video). */
const TituloGancho: React.FC<{ texto: string; dur: number; segun?: string }> = ({ texto, dur, segun }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  const largo = texto.replace(/\[\[|\]\]/g, "").length;
  const caja = (color: string): React.CSSProperties => ({
    fontFamily: GRUESA, fontWeight: 700, fontSize: largo > 34 ? 74 : largo > 22 ? 86 : 104, lineHeight: 1.22, color, textTransform: "uppercase",
    background: "rgba(10,11,14,0.92)", padding: "2px 22px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone",
  });
  return (
    <div style={{ position: "absolute", top: 780, left: 60, right: 60, textAlign: "center", opacity: o }}>
      {segun && (
        <div style={{ display: "inline-block", marginBottom: 14, background: "rgba(10,11,14,0.92)", color: "#fff", fontFamily: MONO, fontWeight: 500, fontSize: 30, padding: "4px 14px" }}>{segun}</div>
      )}
      {texto.split(/(\[\[[^\]]+\]\])/).filter((t) => t.trim()).map((t, i) => (
        <div key={i}><span style={caja(t.startsWith("[[") ? AMARILLO : "#fff")}>{t.startsWith("[[") ? t.slice(2, -2) : t.trim()}</span></div>
      ))}
    </div>
  );
};

/** Barra del gancho: logo, puntos y una cifra que cuenta (como "D1 · · · · 2.850"). */
const Contador: React.FC<{ valor: string; etiqueta?: string; logo?: string; dur: number }> = ({ valor, etiqueta, logo, dur }) => {
  const f = useCurrentFrame();
  const num = leerNumero(valor);
  const p = salida(f / 30);
  const o = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: 300, left: 110, right: 110, opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, background: "rgba(10,11,14,0.92)", borderRadius: 16, padding: "14px 26px 14px 14px" }}>
        {logo ? (
          <div style={{ background: "#fff", borderRadius: 12, width: 92, height: 92, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Img src={src(logo)} style={{ maxWidth: 78, maxHeight: 78, objectFit: "contain" }} />
          </div>
        ) : (
          <div style={{ fontFamily: GRUESA, fontWeight: 500, fontSize: 40, color: "#fff", textTransform: "uppercase", flexShrink: 0 }}>{etiqueta}</div>
        )}
        <div style={{ flex: 1, borderBottom: "6px dotted rgba(255,255,255,0.55)", transform: "translateY(10px)" }} />
        <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: 84, color: AMARILLO, lineHeight: 1 }}>{num && !num.anio ? num.escribir(num.n * p) : valor}</div>
      </div>
      {logo && etiqueta && (
        <div style={{ textAlign: "right", marginTop: 8, fontFamily: MONO, fontSize: 24, color: "#fff", textTransform: "uppercase", textShadow: "0 2px 8px #000" }}>{etiqueta}</div>
      )}
    </div>
  );
};

/** Fuente de lo que se cuenta en la escena ("según Forbes"). */
const Segun: React.FC<{ texto: string; dur: number; abajo?: boolean }> = ({ texto, dur, abajo }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  const trazo = 100 - salida((f - 2) / 8) * 100;
  return (
    <div style={{ position: "absolute", top: abajo ? 280 : 210, left: 60, opacity: o, clipPath: `inset(0 ${trazo}% 0 0)`, background: "rgba(10,11,14,0.88)", color: "#fff", fontFamily: MONO, fontWeight: 500, fontSize: 30, padding: "6px 14px" }}>
      {texto}
    </div>
  );
};

/** Línea de tiempo: el punto viaja a la fecha de esta escena desde la anterior. */
export type Linea = { x0: number; x1: number; texto: string };
const LineaTiempo: React.FC<Linea & { dur: number }> = ({ x0, x1, texto, dur }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [4, 20], [x0, x1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const o = Math.min(interpolate(f, [0, 6], [0, 1], clamp), interpolate(f, [dur - 8, dur], [1, 0], clamp));
  const Y = 1060;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div style={{ position: "absolute", left: 120, right: 120, top: Y, height: 4, background: "rgba(255,255,255,0.7)", boxShadow: "0 0 10px rgba(0,0,0,0.6)" }} />
      <div style={{ position: "absolute", left: x - 14, top: Y - 12, width: 28, height: 28, borderRadius: 14, background: ROJO, border: "4px solid #fff" }} />
      <div style={{ position: "absolute", left: x, top: Y - 80, transform: "translateX(-50%)", background: "rgba(10,11,14,0.92)", color: AMARILLO, fontFamily: MONO, fontWeight: 500, fontSize: 34, padding: "4px 14px", whiteSpace: "nowrap", textTransform: "uppercase" }}>
        {texto}
      </div>
    </div>
  );
};

/** Nombre y cargo sobre la foto de una persona. */
const Persona: React.FC<{ nombre: string; cargo: string }> = ({ nombre, cargo }) => {
  const f = useCurrentFrame();
  const e = salida((f - 4) / 8);
  return (
    <div style={{ position: "absolute", left: 60, top: 930, opacity: e, transform: `translateX(${(1 - e) * -40}px)`, background: "rgba(10,11,14,0.9)", padding: "12px 20px", borderLeft: `6px solid ${AMARILLO}` }}>
      <div style={{ fontFamily: GRUESA, fontWeight: 500, fontSize: 46, color: "#fff", lineHeight: 1.1 }}>{nombre}</div>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, color: AMARILLO, textTransform: "uppercase", marginTop: 4 }}>{cargo}</div>
    </div>
  );
};

/** Tarjeta final: foto y @ del narrador para que lo sigan. */
/** Tarjeta final de "sígueme". Con foto del narrador: foto + @. Sin foto: botón "Seguir" que se toca y pasa a "Siguiendo". */
const TarjetaFinal: React.FC<{ foto: string | null; usuario: string; efectos?: boolean }> = ({ foto, usuario, efectos }) => {
  const f = useCurrentFrame();
  const e = salida(f / 10);
  if (foto) {
    const pulso = 1 + 0.06 * Math.max(0, Math.sin((f - 14) / 5));
    return (
      <AbsoluteFill style={{ background: "rgba(8,10,14,0.78)", backdropFilter: "blur(16px)", justifyContent: "center", alignItems: "center", opacity: Math.min(1, f / 6) }}>
        <div style={{ transform: `scale(${interpolate(e, [0, 1], [0.88, 1])})`, width: 600, padding: "56px 40px 60px", borderRadius: 40, background: "#15171c", border: "2px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
          <div style={{ fontFamily: GRUESA, fontWeight: 500, fontSize: 56, color: "#fff", marginBottom: 36 }}>{usuario}</div>
          <div style={{ position: "relative", width: 300, height: 300 }}>
            <div style={{ width: 300, height: 300, borderRadius: 150, overflow: "hidden", border: `8px solid ${AMARILLO}` }}>
              <Img src={src(foto)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", left: 108, bottom: -38, width: 84, height: 84, borderRadius: 42, background: ROJO, border: "6px solid #15171c", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pulso})` }}>
              <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: 64, color: "#fff", lineHeight: 1, marginTop: -6 }}>+</div>
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 28, color: "rgba(255,255,255,0.75)", marginTop: 66, textAlign: "center", lineHeight: 1.35 }}>Una historia de negocios<br />cada día</div>
        </div>
      </AbsoluteFill>
    );
  }
  // Sin foto: el dedo entra, toca "Seguir" (cuadro TOQUE) y el botón pasa a "Siguiendo ✓"
  const TOQUE = 40;
  const tocado = f >= TOQUE;
  const marca = salida((f - 4) / 12); // la "?" de la serie entra girando
  const dedoX = interpolate(f, [12, TOQUE - 6], [300, 40], { ...clamp, easing: Easing.out(Easing.cubic) });
  const dedoY = interpolate(f, [12, TOQUE - 6], [260, 34], { ...clamp, easing: Easing.out(Easing.cubic) });
  const presion = f >= TOQUE - 4 && f < TOQUE + 4 ? 0.82 : 1;
  const dedoO = interpolate(f, [12, 18, TOQUE + 10, TOQUE + 18], [0, 1, 1, 0], clamp);
  const onda = salida((f - TOQUE) / 14);
  const rebote = tocado ? 1 + 0.12 * Math.sin(Math.min(1, (f - TOQUE) / 10) * Math.PI) : 1 + 0.035 * Math.sin(f / 4);
  const linea2 = salida((f - TOQUE - 6) / 12);
  return (
    <AbsoluteFill style={{ background: "rgba(8,10,14,0.8)", backdropFilter: "blur(18px)", justifyContent: "center", alignItems: "center", opacity: Math.min(1, f / 6) }}>
      <div style={{ transform: `scale(${interpolate(e, [0, 1], [0.86, 1])}) translateY(${interpolate(e, [0, 1], [40, 0])}px)`, width: 760, padding: "64px 48px 70px", borderRadius: 44, background: "#15171c", border: "2px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ width: 210, height: 210, borderRadius: 105, background: AMARILLO, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${marca}) rotate(${interpolate(marca, [0, 1], [-90, 0])}deg)`, boxShadow: "0 0 0 10px rgba(255,212,59,0.18)" }}>
          <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: 150, color: "#111", lineHeight: 1, marginTop: -8 }}>?</div>
        </div>
        <div style={{ fontFamily: GRUESA, fontWeight: 500, fontSize: 62, color: "#fff", marginTop: 40 }}>{usuario}</div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 30, color: "rgba(255,255,255,0.78)", marginTop: 14, textAlign: "center", lineHeight: 1.35 }}>
          Quién es el dueño de<br />las marcas que usas
        </div>
        <div style={{ position: "relative", marginTop: 48 }}>
          {tocado && (
            <div style={{ position: "absolute", left: "50%", top: "50%", width: 440, height: 440, marginLeft: -220, marginTop: -220, borderRadius: 220, border: `6px solid ${AMARILLO}`, opacity: 1 - onda, transform: `scale(${interpolate(onda, [0, 1], [0.3, 1.25])})` }} />
          )}
          <div style={{ minWidth: 440, padding: "26px 56px", borderRadius: 22, background: tocado ? "#2a2d35" : ROJO, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, transform: `scale(${rebote})`, boxShadow: tocado ? "none" : "0 12px 40px rgba(229,55,43,0.45)" }}>
            <div style={{ fontFamily: GRUESA, fontWeight: 700, fontSize: 64, color: "#fff", lineHeight: 1 }}>{tocado ? "✓" : "+"}</div>
            <div style={{ fontFamily: GRUESA, fontWeight: 600, fontSize: 58, color: "#fff", lineHeight: 1, letterSpacing: 1 }}>{tocado ? "Siguiendo" : "Seguir"}</div>
          </div>
          {/* dedo: círculo de toque */}
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 96, height: 96, marginLeft: -48 + dedoX, marginTop: -48 + dedoY, borderRadius: 48, background: "rgba(255,255,255,0.85)", border: "6px solid rgba(255,255,255,0.35)", opacity: dedoO, transform: `scale(${presion})`, boxShadow: "0 8px 30px rgba(0,0,0,0.45)" }} />
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 30, color: AMARILLO, marginTop: 40, opacity: linea2, transform: `translateY(${interpolate(linea2, [0, 1], [16, 0])}px)` }}>Una marca nueva cada día</div>
      </div>
      <Sfx n="ping" v={0.35} on={efectos} desde={TOQUE} />
    </AbsoluteFill>
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

const EscenaDoc: React.FC<{ e: Escena; dur: number; idx: number; efectos?: boolean; logo?: string; linea?: Linea; ultima?: boolean }> = ({ e, dur, idx, efectos, logo, linea, ultima }) => {
  const ps = planos(e);
  // Las piezas 3D (globo, barras) necesitan más tiempo para girar y crecer: pesan el doble que una foto
  const pesos = ps.map((p) => (p.tipo === "pieza" && (p.v.tipo === "globo" || p.v.tipo === "barras3d") ? 2 : 1));
  const totalPeso = pesos.reduce((x, y) => x + y, 0);
  const inicios = pesos.map((_, j) => Math.floor((dur * pesos.slice(0, j).reduce((x, y) => x + y, 0)) / totalPeso));
  const conContador = idx === 0 && Boolean(e.contador);
  const conLogo = idx === 0 && Boolean(logo) && !conContador;
  return (
    <AbsoluteFill>
      {ps.map((p, j) => {
        const from = inicios[j];
        const d = (j === ps.length - 1 ? dur : inicios[j + 1]) - from;
        const son = sonidoDe(p);
        const seed = `${idx}-${j}`;
        // Cambio de escena: siempre barrido; dentro de la escena se alterna barrido y zoom
        const tipo = j === 0 || random(seed + "t") < 0.5 ? "barrido" : "zoom";
        return (
          <Sequence key={j} from={from} durationInFrames={d + T}>
            <Salida desde={d} t={T} activa={!(ultima && j === ps.length - 1)}>
            <Entrada activa={!(idx === 0 && j === 0)} golpe={idx === 0 && j === 0} tipo={tipo}>
              {p.tipo === "foto" ? (
                <>
                  <Foto img={p.img} dur={d + T} seed={seed} />
                  <Credito texto={p.img.credito} />
                  {p.img.persona && <Persona nombre={p.img.persona.nombre} cargo={p.img.persona.cargo} />}
                </>
              ) : (
                <>
                  {p.v.tipo !== "mapa" && <Foto img={p.fondo} dur={d + T} seed={seed} fondo />}
                  <Pieza v={p.v} dur={d} seed={seed} efectos={efectos} />
                </>
              )}
            </Entrada>
            </Salida>
            {son && !(idx === 0 && j === 0) && <Sfx n={tipo === "barrido" && son[0] === "swish" ? "whoosh" : son[0]} v={son[1]} on={efectos} />}
            {idx === 0 && j === 0 && <Sfx n="impacto" v={0.35} on={efectos} />}
          </Sequence>
        );
      })}
      {idx > 0 && <Sequence durationInFrames={18}><Destello seed={`d${idx}`} /></Sequence>}
      {e.rotulo && <Sequence durationInFrames={Math.min(dur, 84)}><Rotulo texto={e.rotulo} dur={Math.min(dur, 84)} /><Sfx n="maquina" v={0.2} on={efectos} desde={3} /></Sequence>}
      {conLogo && <Sequence durationInFrames={Math.min(dur, LOGO_CUADROS)}><Logo archivo={logo!} dur={Math.min(dur, LOGO_CUADROS)} /></Sequence>}
      {conContador && <Sequence durationInFrames={Math.min(dur, TITULO_CUADROS)}><Contador valor={e.contador!.valor} etiqueta={e.contador!.etiqueta} logo={logo} dur={Math.min(dur, TITULO_CUADROS)} /></Sequence>}
      {idx === 0 && e.titulo && <Sequence durationInFrames={Math.min(dur, TITULO_CUADROS)}><TituloGancho texto={e.titulo} dur={Math.min(dur, TITULO_CUADROS)} segun={e.segun} /></Sequence>}
      {idx > 0 && e.segun && <Sequence durationInFrames={Math.min(dur, 84)}><Segun texto={e.segun} dur={Math.min(dur, 84)} abajo={Boolean(e.rotulo)} /></Sequence>}
      {linea && <Sequence durationInFrames={Math.min(dur, 96)}><LineaTiempo {...linea} dur={Math.min(dur, 96)} /></Sequence>}
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

const VACIAS = new Set("de del la las el los lo en y e o u a al un una unos unas por con que se su sus es le mi tu no".split(" "));

/** En cada grupo una palabra manda: la marcada en `destacar` o, si no hay, la más larga. */
const clave = (g: Palabra[], destacar: Set<string>) => {
  const i = g.findIndex((p) => destacar.has(norm(p.texto)));
  if (i >= 0) return i;
  let mejor = 0;
  g.forEach((p, j) => { if (p.texto.length > g[mejor].texto.length) mejor = j; });
  return mejor;
};

/** Cifras en amarillo; palabras clave del guion (`destacar`, casi siempre dueños y nombres) en blanco sobre rojo. */
const CIFRA = /\d|^(mil|millón|millones|billón|billones|ciento|dólares|pesos|%)$/i;
const tipoClave = (p: Palabra, destacar: Set<string>) =>
  CIFRA.test(norm(p.texto)) || /\d/.test(p.texto) ? "cifra" : destacar.has(norm(p.texto)) ? "clave" : "normal";

const Subs: React.FC<{ palabras: Palabra[]; destacar: Set<string>; desde: number }> = ({ palabras, destacar, desde }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const grupos = React.useMemo(() => agrupar(palabras), [palabras]);
  if (frame < desde) return null;
  const g = grupos.find((g) => t >= g[0].inicio - 0.05 && t < g[g.length - 1].fin + 0.1);
  if (!g) return null;
  const k = clave(g, destacar);
  const sombra = "0 0 3px #000, 0 3px 0 #000, 0 6px 22px rgba(0,0,0,0.9)";
  const palabra = (p: Palabra, i: number) => {
    const dt = t - p.inicio;
    const dicha = dt >= -0.03;
    if (i !== k) {
      // Cada palabra "salta" al decirse: entra un poco más grande y se asienta
      const s = interpolate(dt, [-0.03, 0.09], [1.22, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      return (
        <span key={i} style={{ display: "inline-block", margin: "0 10px", fontFamily: GRUESA, fontWeight: 500, fontSize: 56, lineHeight: 1.25,
          color: "#fff", opacity: dicha ? 1 : 0.45, textShadow: sombra, transform: `scale(${dicha ? s : 1})` }}>
          {p.texto.replace(/[.,;:]$/, "")}
        </span>
      );
    }
    const tipo = tipoClave(p, destacar);
    // La palabra que manda: rebota al entrar (sobrepasa y vuelve) y, si es clave, la franja roja se pinta detrás
    const s = interpolate(dt, [-0.03, 0.1, 0.18], [0.7, 1.08, 1], clamp);
    const franja = interpolate(dt, [-0.02, 0.12], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
    const rojo = tipo === "clave";
    return (
      <span key={i} style={{ display: "block", margin: "0 auto", width: "fit-content", fontFamily: GRUESA, fontWeight: 700, fontSize: 112, lineHeight: 1.02,
        color: tipo === "cifra" ? AMARILLO : "#fff", opacity: dicha ? 1 : 0.5, textShadow: rojo ? "0 4px 0 rgba(0,0,0,0.35)" : sombra,
        padding: rojo ? "4px 22px 8px" : 0, transform: `rotate(${rojo ? -2 : 0}deg) scale(${dicha ? s : 0.92})`,
        backgroundImage: rojo ? `linear-gradient(${ROJO}, ${ROJO})` : undefined, backgroundRepeat: "no-repeat", backgroundSize: `${franja}% 100%` }}>
        {p.texto.replace(/[.,;:]$/, "")}
      </span>
    );
  };
  const pop = interpolate(t - g[0].inicio, [-0.05, 0.08], [0.94, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1170, textAlign: "center", transform: `scale(${pop})` }}>
      {g.map(palabra)}
    </div>
  );
};

/* ───────────────────────────── Video ───────────────────────────── */

export const DocumentalVideo: React.FC<VideoProps> = ({ guion, timing, audio, musica, efectos, perfil, usuario }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const destacar = React.useMemo(
    // "19 de noviembre" → "19", "noviembre": sin artículos ni preposiciones, que si no salen grandes en todo el video
    () => new Set(guion.escenas.flatMap((e) => e.destacar.flatMap((d) => d.split(/\s+/).map(norm))).filter((w) => /[\p{L}\d]/u.test(w) && !VACIAS.has(w))),
    [guion],
  );
  const n = guion.escenas.length;
  // La imagen de cada escena entra ADELANTO cuadros antes que su frase (y la anterior termina igual de antes)
  const rango = (i: number) => {
    const from = Math.max(0, Math.round(timing.escenas[i].inicio * fps) - (i > 0 ? ADELANTO : 0));
    const fin = Math.round(timing.escenas[i].fin * fps) - (i < n - 1 ? ADELANTO : 0);
    return { from, dur: Math.max(1, fin - from) };
  };
  const logo = guion.logo?.archivo ?? guion.logo?.url;
  // Línea de tiempo: cada escena con `fecha` mueve el punto a su lugar, de izquierda a derecha
  const conFecha = guion.escenas.map((e, i) => (e.fecha ? i : -1)).filter((i) => i >= 0);
  const xDe = (k: number) => (conFecha.length > 1 ? 180 + (720 * k) / (conFecha.length - 1) : 540);
  const linea = (i: number): Linea | undefined => {
    const k = conFecha.indexOf(i);
    if (k < 0) return undefined;
    return { x0: k > 0 ? xDe(k - 1) : xDe(0) - 60, x1: xDe(k), texto: guion.escenas[i].fecha! };
  };
  const tituloHasta = guion.escenas[0].titulo ? Math.min(TITULO_CUADROS, rango(0).dur) - 4 : 0;
  const cola = usuario ? Math.round(COLA_TARJETA * fps) : 0;
  const volumen = React.useMemo(() => volumenMusica(timing.palabras, fps, durationInFrames), [timing.palabras, fps, durationInFrames]);
  // Subida de tensión que termina justo en la revelación (primer bloque "aprendizaje")
  const revela = guion.escenas.findIndex((e) => e.bloque === "aprendizaje");
  const subida = revela > 1 ? rango(revela).from - Math.round(2 * fps) : -1;
  return (
    <AbsoluteFill style={{ background: "#0a111c" }}>
      <FiltrosMovimiento />
      {audio && <Audio src={src(audio)} />}
      {musica && <Audio src={src(musica)} loop volume={volumen} />}
      {subida > 0 && <Sfx n="subida" v={0.32} on={efectos} desde={subida} />}
      {guion.escenas.map((e, i) => {
        const { from, dur } = rango(i);
        return (
          // la última escena se estira bajo la tarjeta final
          <Sequence key={i} from={from} durationInFrames={dur + (i < n - 1 ? T : cola)}>
            <EscenaDoc e={e} dur={i < n - 1 ? dur : dur + cola} idx={i} efectos={efectos} logo={logo} linea={linea(i)} ultima={i === n - 1} />
          </Sequence>
        );
      })}
      <Grade />
      <Textura />
      <Subs palabras={timing.palabras} destacar={destacar} desde={tituloHasta} />
      {cola > 0 && (
        <Sequence from={durationInFrames - cola}>
          <TarjetaFinal foto={perfil ?? null} usuario={usuario!} efectos={efectos} />
          <Sfx n="swish" v={0.3} on={efectos} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
