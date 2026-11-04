# content-automation

Videos cortos automatizados para TikTok e Instagram: historias y decisiones que construyen, transforman o destruyen negocios. Línea editorial y voz en [`personalidad.md`](personalidad.md).

```
guiones/<fecha>-<slug>.json  →  ElevenLabs (voz + timestamps)  →  Remotion (1080×1920)  →  Zernio (TikTok + Instagram)
```

## Arrancar

```bash
npm install
cp .env.example .env        # y llenar las keys (ya viene lleno en tu máquina)
npm run studio              # editar el diseño en vivo en el navegador
```

## Producir un video

```bash
# 1. imágenes: busca en Wikimedia Commons, descarga y escribe créditos en el guion
npx tsx pipeline/imagenes.ts guiones/2026-11-05-kodak-camara-digital.json

# 2. revisar el video en vivo (sin voz) y cambiar las imágenes que no sirvan
npm run studio

# 3. producir con voz (usa NARRADOR del .env, o --narrador=john). La voz queda en caché.
npx tsx pipeline/producir.ts guiones/2026-11-05-kodak-camara-digital.json

# estilos: mixto (por defecto: fotos + gráficos encima), documental (solo fotos), motion (solo gráficos 2D)
npx tsx pipeline/producir.ts guiones/2026-11-05-kodak-camara-digital.json --estilo=documental
npx tsx pipeline/producir.ts guiones/2026-11-05-kodak-camara-digital.json --estilo=motion

# con voz y subida a Zernio
npx tsx pipeline/producir.ts guiones/<id>.json --publicar=borrador
npx tsx pipeline/producir.ts guiones/<id>.json --publicar=programar --hora=19:30
```

El video queda en `out/<id>.mp4`.

## Guion

Esquema en `src/schema.ts`. Escenas en orden gancho → contexto → decisión → consecuencia → aprendizaje → cierre. Cada escena tiene 1-3 `imagenes` (se reparten la duración de la escena), `destacar` (palabras en serif dorada en los subtítulos), y opcionalmente `titulo` (gancho) y `rotulo` (nombre en pantalla).

Cada imagen se escribe solo con `busqueda`; `imagenes.ts` completa `url`, `archivo`, `credito`, `licencia` y `pagina`. Para cambiar una imagen: borra su `url` y `archivo` y cambia la `busqueda`, o pega la `url` directa de Commons. `modo`: `relleno` (foto centrada sobre fondo desenfocado, para fotos horizontales o de archivo) o `completa`. `filtro`: `bn` o `sepia` para material de archivo.

Imágenes: solo Wikimedia Commons (dominio público, CC0, CC BY, CC BY-SA) y Pexels (requiere `PEXELS_API_KEY` en `.env`). El crédito sale en pantalla. Nada de imágenes de Google.

Formato mixto (el principal): cada escena abre con la foto limpia (~40 % del tiempo, con título o rótulo) y después la foto se oscurece y entran los gráficos de `motion`. Una escena sin `motion` queda solo con fotos.

Gráficos: cada escena puede llevar `motion` con 1-3 visuales: `titulo` (texto con `[[marcador]]` e ícono), `dato` (contador, con `progreso` 0-1 para un anillo o con `icono`), `iconos` (1-3 íconos con texto) y `contraste` (antes → después). Íconos disponibles en `src/iconos.tsx`: camara_digital, rollo, edificio, grafica_baja, tv, dinero, documentos, bombilla, pregunta, celular, cassette, reloj.

Música opcional: pon un archivo con licencia en `public/musica.mp3` y se mezcla al 10 % bajo la voz.

Cada hecho sobre una empresa o persona real va con su fuente en `fuentes`.

## Ciclo diario automático

1. **11 pm (Bogotá):** una tarea programada de Claude escribe 4 guiones para el día siguiente siguiendo [`GUIA-GUIONES.md`](GUIA-GUIONES.md) (2 negocios, 1 biografías, 1 tecnología; 2 con voz de sebas y 2 con voz de john), los valida y hace push a `main`.
2. **Push → GitHub Actions** (`.github/workflows/producir-video.yml`): produce los 4 en paralelo (imágenes, voz, render en formato mixto).
3. **Google Drive:** cada video y su `descripcion.txt` (caption listo para pegar, fuentes y créditos) quedan en `Content Automation · Videos/<fecha>/`.
4. Revisas y publicas.

Para producir a mano uno o varios guiones ya subidos: pestaña Actions → "Producir videos" → Run workflow.

### Configuración en GitHub (Settings → Secrets and variables → Actions)

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `ELEVENLABS_API_KEY_SEBAS`, `ELEVENLABS_VOICE_ID_SEBAS` | cuenta de sebas |
| Secret | `ELEVENLABS_API_KEY_JOHN`, `ELEVENLABS_VOICE_ID_JOHN` | cuenta de john |
| Secret | `RCLONE_DRIVE_TOKEN` | salida de `rclone authorize "drive"` (el JSON entre llaves) |
| Secret | `PEXELS_API_KEY` | opcional |
| Variable | `DRIVE_FOLDER_ID` | `1CMcoqrH_jSRsCHvyk3Gg-4L4ZuYvfL_P` (carpeta "Content Automation · Videos") |
