/**
 * Crea usuarios de prueba para dashboards por rol (user, influencer, brand, agency).
 *
 * Uso:
 *   node server/scripts/seed-demo-dashboard-users.js           # dry-run
 *   node server/scripts/seed-demo-dashboard-users.js --apply
 *
 * Contraseña: DEMO_USERS_PASSWORD en .env o por defecto DemoLink4Deal2026!
 */
const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const User = require('../models/User');
const Role = require('../models/Role');
const Brand = require('../models/Brand');
const Agency = require('../models/Agency');
const Influencer = require('../models/Influencer');

const APPLY = process.argv.includes('--apply');
const DEMO_PASSWORD = process.env.DEMO_USERS_PASSWORD || 'DemoLink4Deal2026!';

const ACCOUNTS = [
    {
        key: 'usuario',
        email: 'demo.usuario@damecodigo.mx',
        firstName: 'Demo',
        lastName: 'Usuario',
        primaryRole: 'user',
        profileTypes: [],
        dashboard: '/dashboard',
        signinHint: 'Usuario básico — panel general',
    },
    {
        key: 'influencer',
        email: 'demo.influencer@damecodigo.mx',
        firstName: 'Demo',
        lastName: 'Influencer',
        primaryRole: 'influencer',
        profileTypes: ['influencer'],
        dashboard: '/dashboard/influencer',
        signinHint: 'Panel creador / campañas',
        influencer: {
            name: 'Demo Influencer',
            username: 'demo-influencer',
            bio: 'Cuenta de prueba para dashboard influencer.',
            profileShortCode: 'DEMOINF',
            status: 'active',
            identityVerificationStatus: 'approved',
            socialMedia: {
                instagram: '@demo_influencer',
                tiktok: '@demo_influencer',
            },
            categories: ['lifestyle', 'moda'],
        },
    },
    {
        key: 'marca',
        email: 'demo.marca@damecodigo.mx',
        firstName: 'Demo',
        lastName: 'Marca',
        primaryRole: 'brand',
        profileTypes: ['brand'],
        dashboard: '/dashboard/brand',
        signinHint: 'Panel marca / promociones',
        brand: {
            companyName: 'Demo Marca Link4Deal',
            industry: 'Retail',
            website: 'https://www.damecodigo.com',
            description: 'Marca de prueba para dashboard.',
            status: 'active',
        },
    },
    {
        key: 'agencia',
        email: 'demo.agencia@damecodigo.mx',
        firstName: 'Demo',
        lastName: 'Agencia',
        primaryRole: 'agency',
        profileTypes: ['agency'],
        dashboard: '/dashboard/agency',
        signinHint: 'Panel agencia',
        agency: {
            name: 'Demo Agencia Link4Deal',
            type: 'digital-marketing',
            category: 'medium',
            description: 'Agencia de prueba para dashboard.',
            website: 'https://www.damecodigo.com',
            contactEmail: 'demo.agencia@damecodigo.mx',
            status: 'active',
            isVerified: true,
        },
    },
];

async function ensureRole(name) {
    let role = await Role.findOne({ name });
    if (role) return role;
    if (!APPLY) {
        console.log(`  (dry-run) crearía rol "${name}" si no existe`);
        return { _id: new mongoose.Types.ObjectId() };
    }
    const templates = {
        user: {
            displayName: 'Usuario',
            type: 'user',
            level: 1,
            isDefault: true,
            isSystem: true,
        },
        influencer: {
            displayName: 'Influencer',
            type: 'influencer',
            level: 2,
            isDefault: false,
            isSystem: true,
        },
        brand: {
            displayName: 'Marca',
            type: 'brand',
            level: 3,
            isDefault: false,
            isSystem: true,
        },
        agency: {
            displayName: 'Agencia',
            type: 'agency',
            level: 4,
            isDefault: false,
            isSystem: true,
        },
    };
    const t = templates[name] || templates.user;
    role = await Role.create({
        name,
        description: `Rol ${name} (demo seed)`,
        permissions: [],
        capabilities: {},
        limits: {},
        ...t,
    });
    console.log(`  ✅ Rol "${name}" creado`);
    return role;
}

async function upsertUser(account, roleId) {
    const existing = await User.findOne({ email: account.email });
    const payload = {
        email: account.email,
        password: DEMO_PASSWORD,
        firstName: account.firstName,
        lastName: account.lastName,
        primaryRole: account.primaryRole,
        profileTypes: account.profileTypes,
        roles: [roleId],
        isVerified: true,
        isActive: true,
        isSuperAdmin: false,
        settings: {
            language: 'es',
            timezone: 'America/Mexico_City',
            notifications: { email: true, push: true, sms: false },
            privacy: { profileVisibility: 'public', showEmail: false, showPhone: false },
        },
    };

    if (!APPLY) {
        return { user: existing, created: !existing, id: existing?._id };
    }

    if (existing) {
        existing.password = DEMO_PASSWORD;
        existing.firstName = payload.firstName;
        existing.lastName = payload.lastName;
        existing.primaryRole = payload.primaryRole;
        existing.profileTypes = payload.profileTypes;
        existing.roles = payload.roles;
        existing.isVerified = true;
        existing.isActive = true;
        await existing.save();
        return { user: existing, created: false, id: existing._id };
    }

    const user = new User(payload);
    await user.save();
    return { user, created: true, id: user._id };
}

async function linkInfluencer(userId, data) {
    let doc = await Influencer.findOne({ userId });
    if (!doc) doc = await Influencer.findOne({ username: data.username });
    if (!APPLY) {
        return { id: doc?._id, created: !doc };
    }
    if (!doc) {
        doc = new Influencer({ ...data, userId });
        await doc.save();
        return { id: doc._id, created: true };
    }
    Object.assign(doc, data);
    doc.userId = userId;
    await doc.save();
    return { id: doc._id, created: false };
}

async function linkBrand(userId, data) {
    let doc = await Brand.findOne({ userId });
    if (!doc) doc = await Brand.findOne({ companyName: data.companyName });
    if (!APPLY) {
        return { id: doc?._id, created: !doc };
    }
    if (!doc) {
        doc = new Brand({ ...data, userId });
        await doc.save();
        return { id: doc._id, created: true };
    }
    Object.assign(doc, data);
    doc.userId = userId;
    await doc.save();
    return { id: doc._id, created: false };
}

async function linkAgency(userId, data) {
    const { contactEmail, ...rest } = data;
    let doc = await Agency.findOne({ owner: userId });
    if (!doc) doc = await Agency.findOne({ name: rest.name });
    if (!APPLY) {
        return { id: doc?._id, created: !doc };
    }
    const agencyPayload = {
        ...rest,
        owner: userId,
        contact: {
            email: contactEmail,
            phone: '+525500000004',
            address: { city: 'Ciudad de México', country: 'México' },
        },
        members: [{ user: userId, role: 'owner' }],
    };
    if (!doc) {
        doc = new Agency(agencyPayload);
        await doc.save();
        return { id: doc._id, created: true };
    }
    Object.assign(doc, agencyPayload);
    doc.owner = userId;
    doc.members = [{ user: userId, role: 'owner' }];
    await doc.save();
    return { id: doc._id, created: false };
}

async function main() {
    console.log('===============================================');
    console.log('  Usuarios demo — dashboards por rol');
    console.log('===============================================');
    console.log(`Modo: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
    console.log(`Contraseña (todos): ${DEMO_PASSWORD}`);
    if (!process.env.DEMO_USERS_PASSWORD) {
        console.log('  (override con DEMO_USERS_PASSWORD en .env)\n');
    } else {
        console.log('');
    }

    await database.connect();
    if (!database.isConnected) {
        console.error('❌ Sin conexión MongoDB');
        process.exit(1);
    }

    const summary = [];

    for (const account of ACCOUNTS) {
        console.log(`--- ${account.key} (${account.primaryRole}) ---`);
        const role = await ensureRole(account.primaryRole === 'user' ? 'user' : account.primaryRole);
        const { user, created, id } = await upsertUser(account, role._id);
        console.log(`  User: ${account.email} ${created ? '(nuevo)' : user ? '(actualizado)' : '(se creará)'}`);

        let extra = '';
        if (account.influencer && id) {
            const inf = await linkInfluencer(id, account.influencer);
            extra += ` | Influencer ${inf.created ? 'creado' : 'vinculado'}`;
        }
        if (account.brand && id) {
            const br = await linkBrand(id, account.brand);
            extra += ` | Brand ${br.created ? 'creado' : 'vinculado'}`;
        }
        if (account.agency && id) {
            const ag = await linkAgency(id, account.agency);
            extra += ` | Agency ${ag.created ? 'creado' : 'vinculado'}`;
        }
        if (extra) console.log(`  ${extra.trim()}`);

        summary.push({
            rol: account.key,
            email: account.email,
            password: DEMO_PASSWORD,
            dashboard: account.dashboard,
            panel: account.signinHint,
        });
        console.log('');
    }

    console.log('===============================================');
    console.log('  RESUMEN — inicia sesión en /signin');
    console.log('===============================================');
    console.table(summary);

    if (!APPLY) {
        console.log('\nEjecuta con --apply para crear/actualizar en MongoDB.\n');
    }

    await mongoose.connection.close();
    process.exit(0);
}

main().catch(async (e) => {
    console.error('❌', e.message);
    try {
        await mongoose.connection.close();
    } catch {
        /* ignore */
    }
    process.exit(1);
});
