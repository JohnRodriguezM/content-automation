import React from "react";

/** Paleta plana del estilo motion. */
export const M = {
  ink: "#1C1B22",
  cream: "#F5EFE3",
  paper: "#FFFDF8",
  red: "#FF5533",
  blue: "#3D5AFE",
  yellow: "#FFC531",
  green: "#2BB673",
  gray: "#CFC8BA",
};

const S = { stroke: M.ink, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Cada ícono recibe `t` (0→1 de aparición) y `f` (frame, para animación en reposo). */
type P = { t: number; f: number };

const CamaraDigital: React.FC<P> = ({ f }) => (
  <g>
    <rect x="30" y="60" width="140" height="95" rx="10" fill={M.paper} {...S} />
    <rect x="40" y="70" width="60" height="30" rx="4" fill={M.gray} {...S} />
    <circle cx="125" cy="108" r="28" fill={M.blue} {...S} />
    <circle cx="125" cy="108" r="12" fill={M.ink} />
    <rect x="45" y="40" width="40" height="22" rx="4" fill={M.yellow} {...S} />
    <circle cx="155" cy="72" r={5 + 2 * Math.abs(Math.sin(f / 8))} fill={M.red} />
    <path d="M40 130 h55 M40 142 h40" {...S} fill="none" />
  </g>
);

const Rollo: React.FC<P> = ({ f }) => (
  <g transform={`rotate(${Math.sin(f / 20) * 4} 100 100)`}>
    <rect x="55" y="45" width="70" height="110" rx="10" fill={M.yellow} {...S} />
    <rect x="55" y="70" width="70" height="40" fill={M.red} {...S} />
    <rect x="72" y="32" width="36" height="16" rx="3" fill={M.ink} />
    <path d={`M125 85 h${30 + Math.sin(f / 10) * 4} v50 h-30`} fill={M.gray} {...S} />
    {[0, 1, 2].map((i) => <rect key={i} x={132 + i * 9} y="92" width="5" height="7" fill={M.ink} />)}
  </g>
);

const Edificio: React.FC<P> = () => (
  <g>
    <path d="M100 20 l12 22 h-24 z" fill={M.red} {...S} />
    <rect x="70" y="42" width="60" height="140" fill={M.paper} {...S} />
    {Array.from({ length: 6 }).map((_, r) =>
      [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={78 + c * 17} y={54 + r * 20} width="10" height="12" fill={M.blue} />),
    )}
    <rect x="92" y="160" width="16" height="22" fill={M.ink} />
    <path d="M30 182 h140" {...S} />
  </g>
);

const GraficaBaja: React.FC<P> = ({ t }) => {
  const largo = 260;
  return (
    <g>
      <path d="M30 30 v140 h145" {...S} fill="none" />
      <path d="M40 50 L75 70 L100 60 L130 120 L165 155" fill="none" stroke={M.red} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={largo} strokeDashoffset={largo * (1 - t)} />
      <path d="M150 155 l15 0 l0 -15" fill="none" stroke={M.red} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity={t > 0.9 ? 1 : 0} />
    </g>
  );
};

const Tv: React.FC<P> = ({ f }) => (
  <g>
    <rect x="30" y="50" width="140" height="105" rx="14" fill={M.paper} {...S} />
    <rect x="45" y="65" width="110" height="75" rx="6" fill={M.blue} {...S} />
    <path d="M75 30 l25 20 l25 -20" fill="none" {...S} />
    <path d="M70 165 h60" {...S} />
    <g opacity={0.6 + 0.4 * Math.abs(Math.sin(f / 6))}>
      <path d="M75 85 l50 40 M125 85 l-50 40" stroke={M.red} strokeWidth="10" strokeLinecap="round" />
    </g>
  </g>
);

const Dinero: React.FC<P> = ({ f }) => (
  <g>
    {[2, 1, 0].map((i) => (
      <g key={i} transform={`translate(${i * 8} ${-i * 14 + Math.sin(f / 12 + i) * 3})`}>
        <rect x="35" y="90" width="130" height="70" rx="8" fill={M.green} {...S} />
        <circle cx="100" cy="125" r="18" fill={M.paper} {...S} />
        <text x="100" y="134" textAnchor="middle" fontFamily="Inter" fontWeight="900" fontSize="26" fill={M.ink}>$</text>
      </g>
    ))}
  </g>
);

const Documentos: React.FC<P> = ({ t }) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const y = 150 - i * 26 - (1 - Math.min(1, t * 4 - i)) * 60;
      const o = Math.max(0, Math.min(1, t * 4 - i));
      return (
        <g key={i} opacity={o} transform={`translate(0 ${y - 150})`}>
          <rect x="45" y="120" width="110" height="45" rx="5" fill={i % 2 ? M.paper : M.yellow} {...S} />
          <path d="M60 135 h60 M60 148 h40" {...S} />
        </g>
      );
    })}
  </g>
);

const Bombilla: React.FC<P> = ({ f }) => (
  <g>
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (-150 + i * 30) * (Math.PI / 180);
      const r1 = 70, r2 = 82 + Math.sin(f / 5 + i) * 6;
      return <path key={i} d={`M${100 + Math.cos(a) * r1} ${90 + Math.sin(a) * r1} L${100 + Math.cos(a) * r2} ${90 + Math.sin(a) * r2}`} stroke={M.yellow} strokeWidth="9" strokeLinecap="round" />;
    })}
    <path d="M100 40 a45 45 0 0 1 28 80 v18 h-56 v-18 a45 45 0 0 1 28 -80z" fill={M.yellow} {...S} />
    <rect x="76" y="140" width="48" height="24" rx="5" fill={M.gray} {...S} />
    <path d="M90 105 l10 -15 l10 15" fill="none" {...S} />
  </g>
);

const Pregunta: React.FC<P> = ({ f }) => (
  <g transform={`rotate(${Math.sin(f / 10) * 6} 100 100)`}>
    <circle cx="100" cy="100" r="72" fill={M.red} {...S} />
    <text x="100" y="132" textAnchor="middle" fontFamily="Inter" fontWeight="900" fontSize="100" fill={M.paper}>?</text>
  </g>
);

const Celular: React.FC<P> = ({ f }) => (
  <g>
    <rect x="62" y="25" width="76" height="150" rx="14" fill={M.ink} />
    <rect x="70" y="38" width="60" height="118" rx="6" fill={M.blue} />
    <circle cx="100" cy="97" r="18" fill={M.paper} opacity={0.5 + 0.5 * Math.abs(Math.sin(f / 9))} />
    <circle cx="100" cy="97" r="8" fill={M.ink} />
    <rect x="88" y="163" width="24" height="5" rx="2" fill={M.gray} />
  </g>
);

const Cassette: React.FC<P> = ({ f }) => (
  <g>
    <rect x="25" y="55" width="150" height="95" rx="10" fill={M.yellow} {...S} />
    <rect x="45" y="72" width="110" height="40" rx="6" fill={M.paper} {...S} />
    {[70, 130].map((cx) => (
      <g key={cx} transform={`rotate(${f * 6} ${cx} 92)`}>
        <circle cx={cx} cy="92" r="13" fill={M.ink} />
        <path d={`M${cx - 8} 92 h16 M${cx} 84 v16`} stroke={M.paper} strokeWidth="4" />
      </g>
    ))}
    <path d="M60 150 l12 -22 h56 l12 22" fill={M.gray} {...S} />
  </g>
);

const Reloj: React.FC<P> = ({ f }) => (
  <g>
    <circle cx="100" cy="105" r="70" fill={M.paper} {...S} />
    <rect x="88" y="22" width="24" height="16" rx="3" fill={M.ink} />
    <path d={`M100 105 L${100 + Math.sin(f / 4) * 52} ${105 - Math.cos(f / 4) * 52}`} stroke={M.red} strokeWidth="8" strokeLinecap="round" />
    <circle cx="100" cy="105" r="8" fill={M.ink} />
  </g>
);

export const ICONOS = {
  camara_digital: CamaraDigital, rollo: Rollo, edificio: Edificio, grafica_baja: GraficaBaja,
  tv: Tv, dinero: Dinero, documentos: Documentos, bombilla: Bombilla, pregunta: Pregunta,
  celular: Celular, cassette: Cassette, reloj: Reloj,
} as const;

export type NombreIcono = keyof typeof ICONOS;
export const NOMBRES_ICONOS = Object.keys(ICONOS) as [NombreIcono, ...NombreIcono[]];

/** Ícono con entrada elástica y flotación suave. */
export const Icono: React.FC<{ nombre: NombreIcono; t: number; f: number; size?: number; fondo?: string }> = ({ nombre, t, f, size = 420, fondo }) => {
  const Comp = ICONOS[nombre];
  const flotar = Math.sin(f / 14) * 6;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible", transform: `translateY(${flotar}px) scale(${t})` }}>
      {fondo && <circle cx="100" cy="100" r="96" fill={fondo} />}
      <Comp t={t} f={f} />
    </svg>
  );
};
