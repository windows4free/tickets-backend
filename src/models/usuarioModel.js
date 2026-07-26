import db from '../config/db.js';

const Usuario = {
    getByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        return rows[0] || null;
    },

    getById: async (id) => {
        const [rows] = await db.query(
            'SELECT id, nombre, email, rol, fecha_creacion FROM usuarios WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    create: async (nombre, email, passwordHash, rol) => {
        const [result] = await db.query(
            'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
            [nombre, email, passwordHash, rol || 'reportero']
        );
        return result.insertId;
    }
};

export default Usuario;