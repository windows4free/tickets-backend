import Falla from '../models/fallaModel.js';
import Historial from '../models/historialModel.js';

export const getHistorialFalla = async (req, res) => {
    try {
        const { id } = req.params;
        const falla = await Falla.getById(id);
        if (!falla) {
            return res.status(404).json({ error: `No existe una falla con ID ${id}` });
        }
        const historial = await Historial.getByFallaId(id);
        res.json(historial);
    } catch (error) {
        console.error('[historialController.getHistorialFalla]', error);
        res.status(500).json({ error: 'Error al obtener el historial' });
    }
};