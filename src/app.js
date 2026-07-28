import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fallaRoutes from './routes/fallaRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: CORS_ORIGIN }));

app.use(express.json());

// Servir archivos subidos (evidencias de fallas)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/salud', (req, res) => {
    res.json({ estado: 'ok', mensaje: 'El servidor está corriendo' });
});

app.use('/api/auth', authRoutes);
app.use('/api/fallas', fallaRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo con ES Modules en el puerto ${PORT}`);
    console.log(`CORS restringido a: ${CORS_ORIGIN}`);
});