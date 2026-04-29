/**
 * Rutas de variables de entorno.
 *
 * Carga en orden:
 * 1) `.env` en la raíz del repo (Vite / vars compartidas)
 * 2) `server/.env` si existe, con override — así MONGODB_URI_ATLAS en server/.env
 *    no se pierde cuando la doc o el despliegue solo actualizan ese archivo.
 *
 * Antes solo se leía la raíz; el backup u otro VPS con credenciales solo en
 * `server/.env` quedaba en modo simulado sin Mongo.
 */
const path = require('path');
const fs = require('fs');

const serverDir = path.join(__dirname, '..');
const projectRoot = path.join(__dirname, '..', '..');
const rootEnvPath = path.join(projectRoot, '.env');
const serverEnvPath = path.join(serverDir, '.env');

(function loadProjectEnv() {
    if (fs.existsSync(rootEnvPath)) {
        require('dotenv').config({ path: rootEnvPath });
    }
    if (fs.existsSync(serverEnvPath)) {
        require('dotenv').config({ path: serverEnvPath, override: true });
    }
})();

/** Ruta “principal” para logs / scripts que esperan un solo archivo */
const envPath = fs.existsSync(serverEnvPath) ? serverEnvPath : rootEnvPath;

module.exports = {
    projectRoot,
    serverDir,
    envPath,
    rootEnvPath,
    serverEnvPath
};
