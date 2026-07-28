import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fallaRoutes from './routes/fallaRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS restringido al origen del frontend definido en las variables de entorno
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: CORS_ORIGIN }));

app.use(express.json());

// Ruta de salud: no toca la base de datos, solo confirma que el servidor
// está corriendo. Útil para diagnosticar problemas de despliegue.
app.get('/api/salud', (req, res) => {
    res.json({ estado: 'ok', mensaje: 'El servidor está corriendo' });
});

app.use('/api/auth', authRoutes);
app.use('/api/fallas', fallaRoutes);

// Manejo global de rutas no definidas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo con ES Modules en el puerto ${PORT}`);
    console.log(`CORS restringido a: ${CORS_ORIGIN}`);
});