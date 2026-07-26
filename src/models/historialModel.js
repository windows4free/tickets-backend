import db from '../config/db.js';

const Historial = {
    registrar: async (fallaId, usuarioId, campo, valorAnterior, valorNuevo) => {
        await db.query(
            'INSERT INTO historial_cambios (falla_id, usuario_id, campo_modificado, valor_anterior, valor_nuevo) VALUES (?, ?, ?, ?, ?)',
            [fallaId, usuarioId, campo, valorAnterior, valorNuevo]
        );
    },

    getByFallaId: async (fallaId) => {
        const [rows] = await db.query(
            `SELECT h.id, h.campo_modificado, h.valor_anterior, h.valor_nuevo, h.fecha_cambio,
                    u.nombre AS usuario_nombre
             FROM historial_cambios h
             JOIN usuarios u ON u.id = h.usuario_id
             WHERE h.falla_id = ?
             ORDER BY h.fecha_cambio DESC`,
            [fallaId]
        );
        return rows;
    }
};

export default Historial;