import db from '../config/db.js';

const Resolucion = {
    registrar: async (fallaId, usuarioId, descripcion, archivoUrl) => {
        const [result] = await db.query(
            'INSERT INTO resoluciones (falla_id, usuario_id, descripcion, archivo_url) VALUES (?, ?, ?, ?)',
            [fallaId, usuarioId, descripcion, archivoUrl]
        );
        return result.insertId;
    },

    getByFallaId: async (fallaId) => {
        const [rows] = await db.query(
            `SELECT r.id, r.descripcion, r.archivo_url, r.fecha_resolucion,
                    u.nombre AS usuario_nombre
             FROM resoluciones r
             JOIN usuarios u ON u.id = r.usuario_id
             WHERE r.falla_id = ?
             ORDER BY r.fecha_resolucion DESC`,
            [fallaId]
        );
        return rows;
    }
};

export default Resolucion;