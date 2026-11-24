// Genera src/puntos-tierra.json: puntos sobre tierra firme para el globo 3D (estilo "globo de puntos").
// Uso: node scripts/puntos-tierra.mjs
import fs from "fs";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
const land = JSON.parse(fs.readFileSync(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url)));
const tierra = feature(land, land.objects.land);
const puntos = [];
const paso = 1.25;
for (let lat = -58; lat <= 82; lat += paso) {
  const n = Math.max(1, Math.round((360 / paso) * Math.cos((lat * Math.PI) / 180)));
  for (let i = 0; i < n; i++) {
    const lon = -180 + (360 * i) / n;
    if (geoContains(tierra, [lon, lat])) puntos.push([+lat.toFixed(2), +lon.toFixed(2)]);
  }
}
fs.writeFileSync(new URL("../src/puntos-tierra.json", import.meta.url), JSON.stringify(puntos));
console.log(puntos.length, "puntos");
