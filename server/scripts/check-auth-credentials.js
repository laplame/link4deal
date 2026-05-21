#!/usr/bin/env node
/**
 * Diagnóstico de login (sin imprimir hash completo).
 *   node server/scripts/check-auth-credentials.js
 *   LOGIN_EMAIL=saul.laplame@gmail.com LOGIN_PASSWORD='Therion@69' node server/scripts/check-auth-credentials.js
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const database = require('../config/database');
const User = require('../models/User');

const EMAIL = (process.env.LOGIN_EMAIL || 'saul.laplame@gmail.com').toLowerCase().trim();
const PASSWORD = process.env.LOGIN_PASSWORD || 'Therion@69';

function buildEmailCandidates(inputEmail) {
    const email = (inputEmail || '').toLowerCase().trim();
    if (!email.includes('@')) return [email];
    const [localRaw, domainRaw] = email.split('@');
    const domain = domainRaw.trim();
    const local = localRaw.trim();
    const localNoPlus = local.split('+')[0];
    const candidates = new Set([`${local}@${domain}`, `${localNoPlus}@${domain}`]);
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
        candidates.add(`${local.replace(/\./g, '')}@${domain}`);
        candidates.add(`${localNoPlus.replace(/\./g, '')}@${domain}`);
    }
    return Array.from(candidates);
}

async function main() {
    await database.connect();
    if (!database.isReady()) {
        console.error('❌ MongoDB no conectado (revisa MONGODB_URI_ATLAS en .env)');
        process.exit(1);
    }

    const candidates = buildEmailCandidates(EMAIL);
    const user = await User.findOne({ email: { $in: candidates } }).select('+password');

    console.log('--- Diagnóstico login ---');
    console.log('Email buscado:', EMAIL);
    console.log('Variantes:', candidates.join(', '));
    console.log('Mongo:', mongoose.connection.host, mongoose.connection.name);

    if (!user) {
        console.error('❌ Usuario NO existe en esta base de datos.');
        console.log('   Ejecuta: node server/scripts/promote-user-to-super-admin.js');
        console.log('   (tras crear el usuario en /signup o importarlo)');
        process.exit(1);
    }

    console.log('✅ Usuario encontrado:', user._id.toString());
    console.log('   email guardado:', user.email);
    console.log('   isActive:', user.isActive);
    console.log('   isSuperAdmin:', user.isSuperAdmin);
    console.log('   primaryRole:', user.primaryRole);
    console.log('   loginAttempts:', user.loginAttempts);
    console.log('   lockUntil:', user.lockUntil || '—');

    if (user.isLocked && user.isLocked()) {
        console.warn('⚠️ Cuenta bloqueada temporalmente por intentos fallidos.');
    }

    const ok = await bcrypt.compare(PASSWORD, user.password);
    if (ok) {
        console.log('✅ La contraseña coincide con la guardada en BD.');
    } else {
        console.error('❌ La contraseña NO coincide con la guardada en BD.');
        console.log('   Ejecuta para resetear:');
        console.log(
            `   SUPER_ADMIN_EMAIL=${EMAIL} SUPER_ADMIN_PASSWORD='${PASSWORD}' node server/scripts/promote-user-to-super-admin.js`,
        );
        process.exit(2);
    }

    await mongoose.connection.close();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
