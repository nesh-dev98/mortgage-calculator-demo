// Minimal Vite-compatible types so the project typechecks even before deps are installed.
// (If you later install Vite, its full types will also work fine with these.)
interface ImportMetaEnv {
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
  // Add your own VITE_* env vars here, e.g.:
  // readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}


