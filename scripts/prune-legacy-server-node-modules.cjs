#!/usr/bin/env node
'use strict';

/**
 * Elimina server/node_modules de instalaciones npm antiguas en server/.
 * Ese árbol suele quedar corrupto (p. ej. iconv-lite sin /encodings) y rompe
 * todos los POST (body-parser). Con pnpm workspace las deps del server viven en la raíz.
 */
const fs = require('fs');
const path = require('path');

const serverNm = path.join(__dirname, '..', 'server', 'node_modules');

if (!fs.existsSync(serverNm)) {
    process.exit(0);
}

const legacyNpmLock = path.join(serverNm, '.package-lock.json');
const isPnpmLayout = fs.existsSync(path.join(serverNm, '.pnpm'));

if (isPnpmLayout && !legacyNpmLock) {
    process.exit(0);
}

console.warn(
    '[prune-legacy-server-node-modules] Quitando server/node_modules (npm legacy o corrupto). ' +
        'Usa solo pnpm install en la raíz del repo.',
);
fs.rmSync(serverNm, { recursive: true, force: true });
