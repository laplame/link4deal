'use strict';

/**
 * Puerto del backend tal como PM2 lo arranca en producción (ecosystem.config.cjs).
 * Las herramientas de Nginx/despliegue deben usar este valor por defecto, no inferir puertos distintos.
 */
const path = require('path');
const ecoPath = path.join(__dirname, '..', 'ecosystem.config.cjs');
const eco = require(ecoPath);
const app = Array.isArray(eco.apps) ? eco.apps[0] : null;
const port =
  (app &&
    ((app.env && app.env.PORT) ||
      (app.env_production && app.env_production.PORT))) ??
  5001;
process.stdout.write(String(port));
