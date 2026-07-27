import Falla from '../models/fallaModel.js';
import Resolucion from '../models/resolucionModel.js';

export const getResolucionesFalla = async (req, res) => {
    try {
        const { id } = req.params;
        const falla = await Falla.getById(id);
        if (!falla) {
            return res.status(404).json({ error: `No existe una falla con ID ${id}` });
        }
        const resoluciones = await Resolucion.getByFallaId(id);
        res.json(resoluciones);
    } catch (error) {
        console.error('[resolucionController.getResolucionesFalla]', error);
        res.status(500).json({ error: 'Error al obtener las resoluciones' });
    }
};