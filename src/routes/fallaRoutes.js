import express from 'express';
import {
    getFallas,
    getFallaById,
    createFalla,
    updateFalla,
    deleteFalla,
    resolverFalla
} from '../controllers/fallaController.js';
import { getHistorialFalla } from '../controllers/historialController.js';
import { getResolucionesFalla } from '../controllers/resolucionController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';
import { subirEvidencia } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(verificarToken);

router.get('/', getFallas);
router.get('/:id', getFallaById);
router.get('/:id/historial', getHistorialFalla);
router.get('/:id/resoluciones', getResolucionesFalla);
router.post('/', createFalla);
router.put('/:id', updateFalla);
router.put('/:id/resolver', subirEvidencia.single('evidencia'), resolverFalla);
router.delete('/:id', verificarRol('admin'), deleteFalla);

export default router;