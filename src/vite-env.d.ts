/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Si es "false", no se llama a /api/bizne-shops (evita 404 hasta desplegar el proxy en el servidor). */
  readonly VITE_ENABLE_BIZNE_SHOPS?: string;
}
