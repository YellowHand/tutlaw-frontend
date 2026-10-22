import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig(({ mode }) => {
  // Mapy źródeł (czytelne ślady błędów w Sentry) wysyłamy tylko wtedy, gdy build zna token Sentry. Token jest sekretem:
  // trzymaj go w .env.production.local (poza gitem) albo w zmiennej środowiskowej, nigdy w .env.production.
  // Bez tokenu build wygląda dokładnie jak dotąd (bez map). Szczegóły: instrukcja Sentry, krok 5.
  const env = loadEnv(mode, process.cwd(), '')
  const uploadSourceMaps = Boolean(env.SENTRY_AUTH_TOKEN)

  return {
    plugins: [
      react(),
      tailwindcss(),
      uploadSourceMaps &&
        sentryVitePlugin({
          authToken: env.SENTRY_AUTH_TOKEN,
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT,
          // Serwer Sentry w UE (Niemcy). Dla konta w regionie USA byłoby https://sentry.io.
          url: 'https://de.sentry.io',
          telemetry: false,
          // Nieudane wysłanie map (zły token, brak sieci) ma przerwać build i wdrożenie, a nie przejść bez śladu.
          errorHandler: (err) => { throw err },
          release: { name: env.VITE_SENTRY_RELEASE || undefined },
          // Po wysłaniu mapy znikają z dist/, żeby nie trafiły na publiczny S3 (kod źródłowy nie ma być do pobrania).
          sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },
        }),
    ],
    // „hidden”: mapy powstają, ale pliki JS nie wskazują na nie (przeglądarka ich nie szuka).
    build: { sourcemap: uploadSourceMaps ? 'hidden' : false },
  }
})
