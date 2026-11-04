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

# con voz y subida a Zernio
npx tsx pipeline/producir.ts guiones/<id>.json --publicar=borrador
npx tsx pipeline/producir.ts guiones/<id>.json --publicar=programar --hora=19:30
```

El video queda en `out/<id>.mp4`.

## Guion

Esquema en `src/schema.ts`. Escenas en orden gancho → contexto → decisión → consecuencia → aprendizaje → cierre. Cada escena tiene 1-3 `imagenes` (se reparten la duración de la escena), `destacar` (palabras en serif dorada en los subtítulos), y opcionalmente `titulo` (gancho) y `rotulo` (nombre en pantalla).

Cada imagen se escribe solo con `busqueda`; `imagenes.ts` completa `url`, `archivo`, `credito`, `licencia` y `pagina`. Para cambiar una imagen: borra su `url` y `archivo` y cambia la `busqueda`, o pega la `url` directa de Commons. `modo`: `relleno` (foto centrada sobre fondo desenfocado, para fotos horizontales o de archivo) o `completa`. `filtro`: `bn` o `sepia` para material de archivo.

Imágenes: solo Wikimedia Commons (dominio público, CC0, CC BY, CC BY-SA) y Pexels (requiere `PEXELS_API_KEY` en `.env`). El crédito sale en pantalla. Nada de imágenes de Google.

Música opcional: pon un archivo con licencia en `public/musica.mp3` y se mezcla al 10 % bajo la voz.

Cada hecho sobre una empresa o persona real va con su fuente en `fuentes`.

## Automatizar en GitHub (después)

`.github/workflows/producir-video.yml` produce cada guion nuevo que entra a `main`. Necesita como Secrets las mismas variables del `.env` (`ELEVENLABS_API_KEY_SEBAS`, `ELEVENLABS_VOICE_ID_SEBAS`, `..._JOHN`, `ZERNIO_API_KEY`) y como Variables `ZERNIO_TIKTOK_ID`, `ZERNIO_INSTAGRAM_ID`, `NARRADOR`, `MODO_PUBLICACION` (`borrador` | `programar`) y `HORA_PUBLICACION`.
