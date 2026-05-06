/**
 * Rutas de variables de entorno.
 *
 * Carga en orden:
 * 1) `.env` en la raíz del repo (Vite / vars compartidas)
 * 2) `server/.env` si existe, con override — así credenciales allí no se pierden.
 *    Si PORT o NODE_ENV ya vienen del proceso (p. ej. PM2), no se sobrescriben.
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
    // PM2 / systemd suelen fijar PORT y NODE_ENV antes de cargar dotenv.
    // server/.env usa override:true para Mongo y demás, pero no debe pisar el puerto de producción.
    const preserveIfAlreadySet = ['PORT', 'NODE_ENV'];
    const preserved = {};
    for (const key of preserveIfAlreadySet) {
        if (process.env[key] !== undefined) preserved[key] = process.env[key];
    }
    if (fs.existsSync(rootEnvPath)) {
        require('dotenv').config({ path: rootEnvPath });
    }
    for (const key of preserveIfAlreadySet) {
        if (preserved[key] !== undefined) process.env[key] = preserved[key];
    }
    if (fs.existsSync(serverEnvPath)) {
        require('dotenv').config({ path: serverEnvPath, override: true });
    }
    for (const key of preserveIfAlreadySet) {
        if (preserved[key] !== undefined) process.env[key] = preserved[key];
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
