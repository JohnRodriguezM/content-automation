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
# solo diseño, sin gastar créditos de voz
npx tsx pipeline/producir.ts guiones/2026-11-04-crecer-sin-caja.json --sin-voz

# con voz (usa NARRADOR del .env, o --narrador=john)
npx tsx pipeline/producir.ts guiones/2026-11-04-crecer-sin-caja.json

# con voz y subida a Zernio
npx tsx pipeline/producir.ts guiones/<id>.json --publicar=borrador
npx tsx pipeline/producir.ts guiones/<id>.json --publicar=programar --hora=19:30
```

El video queda en `out/<id>.mp4`.

## Guion

Esquema en `src/schema.ts`. Escenas en orden gancho → contexto → decisión → consecuencia → aprendizaje → cierre. Visuales: `titulo`, `dato`, `lista`, `comparacion`, `linea_tiempo`. Cada hecho sobre una empresa o persona real va con su fuente en `fuentes`.

## Automatizar en GitHub (después)

`.github/workflows/producir-video.yml` produce cada guion nuevo que entra a `main`. Necesita como Secrets las mismas variables del `.env` (`ELEVENLABS_API_KEY_SEBAS`, `ELEVENLABS_VOICE_ID_SEBAS`, `..._JOHN`, `ZERNIO_API_KEY`) y como Variables `ZERNIO_TIKTOK_ID`, `ZERNIO_INSTAGRAM_ID`, `NARRADOR`, `MODO_PUBLICACION` (`borrador` | `programar`) y `HORA_PUBLICACION`.
