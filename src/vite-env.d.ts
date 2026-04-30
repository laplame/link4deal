/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Si es "false", no se llama a /api/bizne-shops (evita 404 hasta desplegar el proxy en el servidor). */
  readonly VITE_ENABLE_BIZNE_SHOPS?: string;
  /** Misma clave que REDEMPTIONS_LIST_API_KEY en el servidor, para listar redenciones desde el browser. */
  readonly VITE_REDEMPTIONS_LIST_API_KEY?: string;
}
