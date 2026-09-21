#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
ENV_FILE="$ROOT_DIR/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo $ENV_FILE nao encontrado. Copie .env.production.example e preencha." >&2
  exit 1
fi

# Carrega as variaveis (WEB_ROOT e VITE_* usadas no build do frontend).
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
WEB_ROOT="${WEB_ROOT:-/var/www/metas-adm}"

echo "==> Projeto: $ROOT_DIR"
echo "==> Publicacao web: $WEB_ROOT"

for cmd in git npm docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "$cmd nao encontrado no PATH." >&2
    exit 1
  fi
done

echo "==> Atualizando codigo do repositorio"
cd "$ROOT_DIR"
git pull

echo "==> Gerando build do frontend na VM"
cd "$FRONTEND_DIR"
npm ci
npm run build

echo "==> Publicando build em $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo find "$WEB_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo cp -r "$FRONTEND_DIR/dist/." "$WEB_ROOT/"

echo "==> Atualizando containers com docker compose (migrations rodam no start da API)"
cd "$ROOT_DIR"
docker compose --env-file "$ENV_FILE" up -d --build

echo "==> Deploy concluido"
echo "Frontend publicado em: $WEB_ROOT"
echo "Containers ativos:"
docker compose --env-file "$ENV_FILE" ps
