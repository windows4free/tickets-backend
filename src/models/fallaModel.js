import db from '../config/db.js';

const Falla = {
    // usuarioId: si viene, filtra solo las fallas de ese usuario (reportero)
    // filtros: { q, estado, prioridad } — todos opcionales
    getAll: async (usuarioId = null, filtros = {}) => {
        const condiciones = [];
        const valores = [];

        if (usuarioId) {
            condiciones.push('reportado_por = ?');
            valores.push(usuarioId);
        }

        if (filtros.q) {
            // Busca coincidencias en título O descripción
            condiciones.push('(titulo LIKE ? OR descripcion LIKE ?)');
            valores.push(`%${filtros.q}%`, `%${filtros.q}%`);
        }

        if (filtros.estado) {
            condiciones.push('estado = ?');
            valores.push(filtros.estado);
        }

        if (filtros.prioridad) {
            condiciones.push('prioridad = ?');
            valores.push(filtros.prioridad);
        }

        const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await db.query(
            `SELECT * FROM fallas ${where} ORDER BY fecha_creacion DESC`,
            valores
        );
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query('SELECT * FROM fallas WHERE id = ?', [id]);
        return rows[0] || null;
    },

    create: async (titulo, descripcion, estado, prioridad, reportadoPor) => {
        const [result] = await db.query(
            'INSERT INTO fallas (titulo, descripcion, estado, prioridad, reportado_por) VALUES (?, ?, ?, ?, ?)',
            [titulo, descripcion, estado || 'reportada', prioridad || 'media', reportadoPor]
        );
        return result.insertId;
    },

    update: async (id, titulo, descripcion, estado, prioridad) => {
        const [result] = await db.query(
            'UPDATE fallas SET titulo = ?, descripcion = ?, estado = ?, prioridad = ? WHERE id = ?',
            [titulo, descripcion, estado, prioridad, id]
        );
        return result.affectedRows > 0;
    },

    delete: async (id) => {
        const [result] = await db.query('DELETE FROM fallas WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

export default Falla;