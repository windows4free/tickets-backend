import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Se requiere iniciar sesión para esta acción' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

export const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Se requiere iniciar sesión para esta acción' });
        }
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                error: `No tienes permiso para esta acción (se requiere rol: ${rolesPermitidos.join(' o ')})`
            });
        }
        next();
    };
};