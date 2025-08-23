/**
 * Middleware de autenticación básico
 * Por ahora es un placeholder que siempre permite el acceso
 */

const auth = (req, res, next) => {
    // TODO: Implementar lógica de autenticación real
    // Por ahora, permitimos todo el acceso
    console.log('🔐 Middleware de autenticación ejecutado');
    next();
};

module.exports = auth;
