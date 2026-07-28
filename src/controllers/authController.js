import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/usuarioModel.js';

const ROLES_VALIDOS = ['admin', 'reportero'];
const JWT_EXPIRES_IN = '8h';
const PASSWORD_MIN_LENGTH = 8;

// Expresión regular simple para validar formato de email (algo@algo.algo)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const firmarToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

export const register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        const rol = 'reportero';

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
        }
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'El email no tiene un formato válido' });
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
            return res.status(400).json({ error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` });
        }

        const existente = await Usuario.getByEmail(email);
        if (existente) {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const id = await Usuario.create(nombre, email, passwordHash, rol);

        const usuario = { id, nombre, email, rol };
        const token = firmarToken(usuario);

        res.status(201).json({ token, usuario });
    } catch (error) {
        console.error('[authController.register]', error);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        const usuario = await Usuario.getByEmail(email);
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = firmarToken(usuario);
        res.json({
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
        });
    } catch (error) {
        console.error('[authController.login]', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

export const crearAdmin = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
        }
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'El email no tiene un formato válido' });
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
            return res.status(400).json({ error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` });
        }

        const existente = await Usuario.getByEmail(email);
        if (existente) {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const id = await Usuario.create(nombre, email, passwordHash, 'admin');

        const usuario = { id, nombre, email, rol: 'admin' };
        res.status(201).json({ usuario });
    } catch (error) {
        console.error('[authController.crearAdmin]', error);
        res.status(500).json({ error: 'Error al crear el administrador' });
    }
};

export const perfil = async (req, res) => {
    try {
        const usuario = await Usuario.getById(req.usuario.id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        console.error('[authController.perfil]', error);
        res.status(500).json({ error: 'Error al obtener el perfil' });
    }
};