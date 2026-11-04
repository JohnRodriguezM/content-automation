#!/usr/bin/env bash
# Crea el repo privado en GitHub, sube el código y carga secretos y variables.
# Uso: bash scripts/configurar-github.sh
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="JohnRodriguezM/content-automation"
DRIVE_FOLDER_ID="1CMcoqrH_jSRsCHvyk3Gg-4L4ZuYvfL_P"

command -v gh >/dev/null || brew install gh
gh auth status >/dev/null 2>&1 || gh auth login --web --git-protocol https

# 1. Repo privado + push del código
if gh repo view "$REPO" >/dev/null 2>&1; then
  echo "✓ El repo ya existe"
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$REPO.git"
  git push -u origin main
else
  gh repo create "$REPO" --private --source=. --remote=origin --push
fi

# 2. Secretos de ElevenLabs desde .env (nunca se imprimen)
set -a; source .env; set +a
for v in ELEVENLABS_API_KEY_SEBAS ELEVENLABS_VOICE_ID_SEBAS ELEVENLABS_API_KEY_JOHN ELEVENLABS_VOICE_ID_JOHN; do
  [ -n "${!v:-}" ] || { echo "✗ Falta $v en .env"; exit 1; }
  printf '%s' "${!v}" | gh secret set "$v" -R "$REPO"
done
[ -n "${PEXELS_API_KEY:-}" ] && printf '%s' "$PEXELS_API_KEY" | gh secret set PEXELS_API_KEY -R "$REPO"

# 3. Token de Drive: si rclone ya tiene configurado un remoto "drive", se toma de ahí; si no, se pide pegarlo
TOKEN="$(rclone config show drive 2>/dev/null | sed -n 's/^token = //p' || true)"
if [ -z "$TOKEN" ]; then
  echo
  echo "Pega el JSON de 'rclone authorize \"drive\"' (la línea que empieza con {\"access_token\") y presiona Enter:"
  IFS= read -r TOKEN
fi
printf '%s' "$TOKEN" | gh secret set RCLONE_DRIVE_TOKEN -R "$REPO"

# 4. Variable con la carpeta de Drive
gh variable set DRIVE_FOLDER_ID --body "$DRIVE_FOLDER_ID" -R "$REPO"

echo
echo "✓ Listo. Secretos cargados:"
gh secret list -R "$REPO"
gh variable list -R "$REPO"
