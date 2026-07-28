import express from 'express';
import { register, login, perfil, crearAdmin } from '../controllers/authController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/perfil', verificarToken, perfil);
router.post('/crear-admin', verificarToken, verificarRol('admin'), crearAdmin);

export default router;