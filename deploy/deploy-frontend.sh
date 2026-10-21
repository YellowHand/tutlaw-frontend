#!/usr/bin/env bash
# Wdrożenie frontendu na AWS (S3 + CloudFront) jednym poleceniem, z katalogu frontendu:
#   S3_BUCKET=gradusiuris-frontend CLOUDFRONT_DISTRIBUTION_ID=E123ABC456DEF npm run deploy
# Windows: uruchamiaj w Git Bash albo WSL (potrzebny jest zainstalowany i skonfigurowany AWS CLI: aws configure / aws sso login).
#
# Zmienne:
#   S3_BUCKET                    (wymagane)  nazwa bucketa S3 ze stroną
#   CLOUDFRONT_DISTRIBUTION_ID   (wymagane)  identyfikator dystrybucji CloudFront (np. E2ABCDEF123456)
#   AWS_PROFILE                  (opcjonalne) profil AWS CLI
#   SKIP_CHECKS                  (opcjonalne) 1 = pomiń npm ci / lint (domyślnie uruchamiane)
#
# Kolejność ma znaczenie: najpierw pliki z haszem w nazwie (assets/), potem reszta, na końcu index.html. Dzięki temu w żadnej
# chwili index.html nie wskazuje na plik, którego jeszcze nie ma. Stare pliki z assets/ ZOSTAJĄ (nie używamy --delete): ktoś, kto
# ma otwartą starą wersję strony, nadal dociągnie swoje fragmenty. Porządek robi się rzadko, ręcznie (patrz instrukcje wdrożenia).
set -euo pipefail

: "${S3_BUCKET:?Ustaw S3_BUCKET, np. S3_BUCKET=gradusiuris-frontend}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Ustaw CLOUDFRONT_DISTRIBUTION_ID (identyfikator dystrybucji z konsoli CloudFront)}"
command -v aws >/dev/null 2>&1 || { echo "Brak AWS CLI. Zainstaluj: https://aws.amazon.com/cli/" >&2; exit 1; }

cd "$(dirname "$0")/.."

echo "== 1/5 Sprawdzanie dostępu do AWS"
aws sts get-caller-identity --query Account --output text >/dev/null

echo "== 2/5 Budowanie (adres backendu z .env.production)"
grep -q "^VITE_API_BASE_URL=https://" .env.production || { echo ".env.production musi zawierać VITE_API_BASE_URL=https://..." >&2; exit 1; }
if [ "${SKIP_CHECKS:-0}" != "1" ]; then
  npm ci
  npx eslint .
fi
npm run build
[ -f dist/index.html ] || { echo "Brak dist/index.html po buildzie" >&2; exit 1; }

echo "== 3/5 Wysyłanie plików z haszem (assets/, cache na rok)"
aws s3 sync dist/assets "s3://$S3_BUCKET/assets" \
  --cache-control "public,max-age=31536000,immutable"

echo "== 4/5 Wysyłanie pozostałych plików (ikony, manifest), potem index.html"
aws s3 sync dist "s3://$S3_BUCKET" \
  --exclude "assets/*" --exclude "index.html" \
  --cache-control "public,max-age=3600"
aws s3 cp dist/site.webmanifest "s3://$S3_BUCKET/site.webmanifest" \
  --content-type "application/manifest+json" --cache-control "public,max-age=3600"
# index.html bez pamięci podręcznej: przeglądarka zawsze pyta, czy jest nowa wersja (a ta wskazuje na nowe pliki z assets/).
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
  --content-type "text/html; charset=utf-8" --cache-control "no-cache"

echo "== 5/5 Odświeżanie CloudFront (unieważnienie pamięci podręcznej)"
INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*" \
  --query Invalidation.Id --output text)
aws cloudfront wait invalidation-completed --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --id "$INVALIDATION_ID"

echo "Gotowe. Otwórz https://gradusiuris.pl (odśwież bez pamięci podręcznej: Ctrl+Shift+R)."
