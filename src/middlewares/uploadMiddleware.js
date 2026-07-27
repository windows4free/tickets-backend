import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, nombreUnico);
    }
});

const filtroArchivos = (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|gif|pdf/;
    const extensionValida = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
    if (extensionValida) return cb(null, true);
    cb(new Error('Solo se permiten imágenes (jpg, png, gif) o archivos PDF'));
};

export const subirEvidencia = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
    fileFilter: filtroArchivos
});