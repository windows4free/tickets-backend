import express from 'express';
import { register, login, perfil } from '../controllers/authController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/perfil', verificarToken, perfil);

export default router;