/**
 * Ruta del .env en el directorio raíz del proyecto.
 * Uso: require('dotenv').config({ path: require('./config/envPath').envPath })
 * Desde server/: __dirname = server/config → projectRoot = raíz del repo.
 */
const path = require('path');
const projectRoot = path.join(__dirname, '..', '..');
const envPath = path.join(projectRoot, '.env');
module.exports = { projectRoot, envPath };
