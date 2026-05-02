/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Si es "false", no se llama a /api/bizne-shops (evita 404 hasta desplegar el proxy en el servidor). */
  readonly VITE_ENABLE_BIZNE_SHOPS?: string;
  /** Misma clave que REDEMPTIONS_LIST_API_KEY en el servidor, para listar redenciones desde el browser. */
  readonly VITE_REDEMPTIONS_LIST_API_KEY?: string;
  /** Clave de la API de JavaScript de Google Maps (mapa en el index). Origen: `google_maps` o `VITE_GOOGLE_MAPS_API_KEY` en .env vía vite.config. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}
