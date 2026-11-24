/**
 * Piezas 3D (Three.js vía @remotion/three) para el estilo documental. Sin marcas: solo datos y geografía.
 * - Globo: la Tierra gira desde el país del dueño hasta Colombia y dibuja un arco entre los dos puntos.
 * - Barras3D: participaciones de mercado que suben como columnas mientras la cámara gira.
 * El render necesita WebGL: en pipeline/producir.ts va con chromiumOptions.gl = "swangle".
 */
import React from "react";
import { continueRender, delayRender, interpolate, useCurrentFrame, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import { geoInterpolate } from "d3-geo";
import mundo from "world-atlas/countries-110m.json";
import { LUGARES } from "./lugares";
import TIERRA from "./puntos-tierra.json";

const W = 1080;
const H = 1920;
const AMARILLO = "#FFD43B";
const ROJO = "#E5372B";
const GRUESA = "Oswald, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = (p: number) => Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, p)));
const salida = (p: number) => Easing.out(Easing.cubic)(Math.min(1, Math.max(0, p)));

const MUNDO = mundo as unknown as { objects: { countries: unknown } };
const PAISES = feature(MUNDO as never, MUNDO.objects.countries as never) as unknown as FeatureCollection<Geometry, unknown>;

/** lat/lon (grados) → punto en la esfera. lon 0, lat 0 mira a la cámara (+z). */
const aXYZ = (lat: number, lon: number, r = 1) => {
  const f = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(f) * Math.sin(l), r * Math.sin(f), r * Math.cos(f) * Math.cos(l));
};

/** Contornos de países como segmentos sobre la esfera; los de `resaltar` (códigos ISO numéricos) aparte. */
const contornos = (resaltar: Set<string>) => {
  const base: number[] = [];
  const marcados: number[] = [];
  for (const ft of PAISES.features) {
    const g = ft.geometry;
    if (!g) continue;
    const poligonos = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    const destino = resaltar.has(String(ft.id)) ? marcados : base;
    for (const pol of poligonos)
      for (const anillo of pol)
        for (let k = 1; k < anillo.length; k++) {
          const a = aXYZ(anillo[k - 1][1], anillo[k - 1][0], 1.003);
          const b = aXYZ(anillo[k][1], anillo[k][0], 1.003);
          destino.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
  }
  const geo = (arr: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    return g;
  };
  return { base: geo(base), marcados: geo(marcados) };
};

/** Rejilla de meridianos y paralelos cada 20°. */
const rejilla = () => {
  const pts: number[] = [];
  for (let lat = -80; lat <= 80; lat += 20)
    for (let lon = -180; lon < 180; lon += 4) {
      const a = aXYZ(lat, lon, 1.001), b = aXYZ(lat, lon + 4, 1.001);
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  for (let lon = -180; lon < 180; lon += 20)
    for (let lat = -88; lat < 88; lat += 4) {
      const a = aXYZ(lat, lon, 1.001), b = aXYZ(lat + 4, lon, 1.001);
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
};

const N_ARCO = 140;

/** Puntos de tierra firme (scripts/puntos-tierra.mjs): el globo se ve "de puntos", sin textura. */
const geoTierra = (() => {
  let g: THREE.BufferGeometry | null = null;
  return () => {
    if (g) return g;
    const pos: number[] = [];
    for (const [lat, lon] of TIERRA as [number, number][]) {
      const v = aXYZ(lat, lon, 1.004);
      pos.push(v.x, v.y, v.z);
    }
    g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  };
})();

const EscenaGlobo: React.FC<{ desde: [number, number, string]; hasta: [number, number, string]; dur: number }> = ({ desde, hasta, dur }) => {
  const f = useCurrentFrame();
  const datos = React.useMemo(() => {
    const { marcados } = contornos(new Set([desde[2], hasta[2]]));
    const a = aXYZ(desde[0], desde[1]), b = aXYZ(hasta[0], hasta[1]);
    const angulo = a.angleTo(b);
    const alto = 0.06 + 0.3 * (angulo / Math.PI);
    const s = Math.sin(angulo) || 1;
    const curva: THREE.Vector3[] = [];
    for (let k = 0; k <= N_ARCO; k++) {
      const t = k / N_ARCO;
      const q = angulo > 0.01
        ? new THREE.Vector3().addScaledVector(a, Math.sin((1 - t) * angulo) / s).addScaledVector(b, Math.sin(t * angulo) / s)
        : new THREE.Vector3().copy(a).lerp(b, t).normalize();
      curva.push(q.multiplyScalar(1.006 + alto * Math.sin(Math.PI * t)));
    }
    const medio = geoInterpolate([desde[1], desde[0]], [hasta[1], hasta[0]])(0.5); // [lon, lat]
    return { marcados, a, b, curva, tierra: geoTierra(), rejilla: rejilla(), medio: { lat: medio[1], lon: medio[0] } };
  }, [desde, hasta]);

  // Tiempos: gira desde el país del dueño hacia el punto medio de la ruta; el arco se dibuja en el medio
  const giro = suave(interpolate(f, [0, dur * 0.7], [0, 1], clamp));
  const lat = interpolate(giro, [0, 1], [desde[0], datos.medio.lat]);
  let dl = datos.medio.lon - desde[1]; // longitud por el camino corto
  if (dl > 180) dl -= 360;
  if (dl < -180) dl += 360;
  const lon = desde[1] + dl * giro;
  const dibujo = suave(interpolate(f, [dur * 0.15, dur * 0.65], [0, 1], clamp));
  const n = Math.max(2, Math.round(dibujo * N_ARCO));
  const tubo = React.useMemo(() => {
    const c = new THREE.CatmullRomCurve3(datos.curva.slice(0, n + 1));
    return new THREE.TubeGeometry(c, Math.max(2, n), 0.011, 8, false);
  }, [datos, n]);
  const punta = datos.curva[Math.min(n, N_ARCO)];
  const llega = interpolate(f, [dur * 0.62, dur * 0.72], [0, 1], clamp);
  const pulso = (k: number) => 1 + 0.5 * (((f + k) % 24) / 24);
  const zoom = interpolate(f, [0, dur], [3.9, 3.45], clamp);
  const entra = salida(f / 12);

  return (
    <>
      <PonerCamara pos={new THREE.Vector3(0, 0, zoom)} mira={new THREE.Vector3(0, 0, 0)} />
      <group rotation={[(lat * Math.PI) / 180, 0, 0]} scale={interpolate(entra, [0, 1], [0.82, 1])}>
        <group rotation={[0, (-lon * Math.PI) / 180, 0]}>
          <mesh>
            <sphereGeometry args={[1, 64, 64]} />
            <meshBasicMaterial color="#0c1f36" />
          </mesh>
          <lineSegments geometry={datos.rejilla}>
            <lineBasicMaterial color="#244566" transparent opacity={0.45} />
          </lineSegments>
          <points geometry={datos.tierra}>
            <pointsMaterial color="#8fb3db" size={3.2} sizeAttenuation={false} />
          </points>
          <lineSegments geometry={datos.marcados}>
            <lineBasicMaterial color={AMARILLO} />
          </lineSegments>
          <mesh geometry={tubo}>
            <meshBasicMaterial color={AMARILLO} />
          </mesh>
          {dibujo > 0 && dibujo < 1 && (
            <mesh position={punta} scale={0.024}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          )}
          <mesh position={datos.a.clone().multiplyScalar(1.012)} scale={0.026}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={AMARILLO} />
          </mesh>
          <mesh position={datos.a.clone().multiplyScalar(1.012)} scale={0.026 * pulso(0) * 1.6}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={AMARILLO} transparent opacity={0.25 * (2 - pulso(0))} />
          </mesh>
          <mesh position={datos.b.clone().multiplyScalar(1.012)} scale={(0.3 + 0.7 * llega) * 0.03}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={ROJO} />
          </mesh>
          <mesh position={datos.b.clone().multiplyScalar(1.012)} scale={llega * 0.03 * pulso(12) * 1.7}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={ROJO} transparent opacity={0.3 * (2 - pulso(12))} />
          </mesh>
        </group>
      </group>
      {/* halo de atmósfera */}
      <mesh scale={1.1}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color="#4aa3ff" transparent opacity={0.13} side={THREE.BackSide} />
      </mesh>
    </>
  );
};

const LADO_GLOBO = 800; // termina en y=1150: los subtítulos arrancan en 1170

export const Globo: React.FC<{ desde: string; hasta?: string; etiqueta: string; dur: number }> = ({ desde, hasta = "bogota", etiqueta, dur }) => {
  const f = useCurrentFrame();
  const a = LUGARES[desde], b = LUGARES[hasta];
  if (!a || !b) return null;
  const chip = salida((f - 4) / 10);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", justifyContent: "center", opacity: chip, transform: `translateY(${(1 - chip) * -24}px)` }}>
        <div style={{ background: AMARILLO, padding: "12px 30px", fontFamily: GRUESA, fontWeight: 700, fontSize: 56, color: "#111", textTransform: "uppercase" }}>{etiqueta}</div>
      </div>
      <div style={{ position: "absolute", left: (W - LADO_GLOBO) / 2, top: 350, width: LADO_GLOBO, height: LADO_GLOBO }}>
        <ThreeCanvas width={LADO_GLOBO} height={LADO_GLOBO} flat camera={{ fov: 35, position: [0, 0, 3.9] }} gl={{ antialias: true, alpha: true }}>
          <EscenaGlobo desde={a} hasta={b} dur={dur} />
        </ThreeCanvas>
      </div>
    </div>
  );
};

/* ───────────────────────────── Barras 3D ───────────────────────────── */

let fuentes: Promise<unknown> | null = null;
const useFuentes = () => {
  const [lista, setLista] = React.useState(false);
  const [h] = React.useState(() => delayRender("fuentes para las barras 3D"));
  React.useEffect(() => {
    // Las dos pesas de Oswald que usan las texturas: si la 500 no está cargada, el canvas dibuja los nombres con la fuente de respaldo
    fuentes ??= Promise.all([document.fonts.load(`700 170px ${GRUESA}`, "0123456789,% "), document.fonts.load(`500 128px ${GRUESA}`, "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ'"), document.fonts.load(`500 60px ${MONO}`)]).catch(() => null);
    fuentes.then(() => { setLista(true); continueRender(h); });
  }, [h]);
  return lista;
};

/** Texto en una textura (siempre mira a la cámara como sprite). */
const textoSprite = (texto: string, color: string, fuente: string, ancho = 1024, alto = 256) => {
  const c = document.createElement("canvas");
  c.width = ancho; c.height = alto;
  const ctx = c.getContext("2d")!;
  ctx.font = fuente;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, ancho / 2, alto / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false });
};

type ItemBarra = { texto: string; valor: number; etiqueta: string };
const COLORES = [AMARILLO, "#5b8def", "#e5372b", "#9aa3ad"];

const EscenaBarras: React.FC<{ items: ItemBarra[]; dur: number }> = ({ items, dur }) => {
  const f = useCurrentFrame();
  const max = Math.max(...items.map((i) => i.valor), 1);
  const sep = 1.3; // los nombres (hasta 14 letras) no se montan con la columna vecina
  const x0 = -((items.length - 1) * sep) / 2;
  const mats = React.useMemo(
    () => items.map((it) => ({
      valor: textoSprite(it.etiqueta, "#ffffff", `700 170px ${GRUESA}`),
      nombre: textoSprite(it.texto.toUpperCase(), "#ffffff", `500 128px ${GRUESA}`),
    })),
    [items],
  );
  const angulo = interpolate(f, [0, dur], [-0.3, 0.24], clamp);
  const r = 3.2 + items.length * 0.9; // más columnas, cámara más lejos para que quepan las etiquetas
  const cam = new THREE.Vector3(Math.sin(angulo) * r, 2.1, Math.cos(angulo) * r);
  return (
    <>
      <PonerCamara pos={cam} mira={new THREE.Vector3(0, 0.9, 0)} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <directionalLight position={[-4, 2, -2]} intensity={0.4} />
      <gridHelper args={[8, 16, "#3a4a5e", "#243040"]} position={[0, 0, 0]} />
      {items.map((it, i) => {
        const crece = salida(interpolate(f, [8 + i * 7, 8 + i * 7 + 26], [0, 1], clamp));
        const alto = Math.max(0.02, (it.valor / max) * 2.2 * crece);
        const x = x0 + i * sep;
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, alto / 2, 0]}>
              <boxGeometry args={[0.72, alto, 0.72]} />
              <meshStandardMaterial color={COLORES[i % COLORES.length]} roughness={0.45} metalness={0.1} />
            </mesh>
            <sprite material={mats[i].valor} position={[0, alto + 0.32, 0]} scale={[1.6 * crece + 0.001, 0.4 * crece + 0.001, 1]} />
            <sprite material={mats[i].nombre} position={[0, -0.36, 0.5]} scale={[1.7, 0.425, 1]} />
          </group>
        );
      })}
    </>
  );
};

/** Ubica la cámara por defecto del lienzo en cada cuadro. */
const PonerCamara: React.FC<{ pos: THREE.Vector3; mira: THREE.Vector3 }> = ({ pos, mira }) => {
  const camera = useThree((s) => s.camera);
  camera.position.copy(pos);
  camera.lookAt(mira);
  camera.updateProjectionMatrix();
  return null;
};

const ALTO_BARRAS = 730; // de y=430 a 1160, encima de los subtítulos

export const Barras3D: React.FC<{ titulo?: string; items: ItemBarra[]; dur: number }> = ({ titulo, items, dur }) => {
  const f = useCurrentFrame();
  const listas = useFuentes();
  const t = salida(f / 10);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {titulo && (
        <div style={{ position: "absolute", top: 300, left: 60, right: 60, textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 24}px)` }}>
          <span style={{ background: AMARILLO, padding: "10px 26px", fontFamily: GRUESA, fontWeight: 700, fontSize: 56, color: "#111", textTransform: "uppercase", lineHeight: 1.5, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{titulo}</span>
        </div>
      )}
      <div style={{ position: "absolute", left: 0, top: 430, width: W, height: ALTO_BARRAS }}>
        {listas && (
          <ThreeCanvas width={W} height={ALTO_BARRAS} flat camera={{ fov: 38, position: [0, 2.1, 6.4] }} gl={{ antialias: true, alpha: true }}>
            <EscenaBarras items={items} dur={dur} />
          </ThreeCanvas>
        )}
      </div>
    </div>
  );
};

export const ALTO_LIENZO = H;
