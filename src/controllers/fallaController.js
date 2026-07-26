import Falla from '../models/fallaModel.js';
import Historial from '../models/historialModel.js';
import Resolucion from '../models/resolucionModel.js';

const ESTADOS_VALIDOS = ['reportada', 'en solucion', 'solucionada'];
const PRIORIDADES_VALIDAS = ['baja', 'media', 'alta', 'critica'];
const TITULO_MAX_LENGTH = 255;

const validarFalla = ({ titulo, estado, prioridad }, { tituloObligatorio = true } = {}) => {
    if (tituloObligatorio && !titulo) {
        return 'El título es obligatorio';
    }
    if (titulo !== undefined && titulo !== null && titulo.length > TITULO_MAX_LENGTH) {
        return `El título no puede superar los ${TITULO_MAX_LENGTH} caracteres`;
    }
    if (estado !== undefined && estado !== null && !ESTADOS_VALIDOS.includes(estado)) {
        return `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`;
    }
    if (prioridad !== undefined && prioridad !== null && !PRIORIDADES_VALIDAS.includes(prioridad)) {
        return `La prioridad debe ser una de: ${PRIORIDADES_VALIDAS.join(', ')}`;
    }
    return null;
};

export const getFallas = async (req, res) => {
    try {
        const usuarioId = req.usuario.rol === 'admin' ? null : req.usuario.id;
        const { q, estado, prioridad } = req.query;
        const filtros = { q, estado, prioridad };
        const fallas = await Falla.getAll(usuarioId, filtros);
        res.json(fallas);
    } catch (error) {
        console.error('[fallaController.getFallas]', error);
        res.status(500).json({ error: 'Error al obtener las fallas' });
    }
};

export const getFallaById = async (req, res) => {
    try {
        const { id } = req.params;
        const falla = await Falla.getById(id);
        if (!falla) {
            return res.status(404).json({ error: `No existe una falla con ID ${id}` });
        }
        if (req.usuario.rol !== 'admin' && falla.reportado_por !== req.usuario.id) {
            return res.status(403).json({ error: 'No tienes permiso para ver esta falla' });
        }
        res.json(falla);
    } catch (error) {
        console.error('[fallaController.getFallaById]', error);
        res.status(500).json({ error: 'Error al obtener la falla' });
    }
};

export const createFalla = async (req, res) => {
    try {
        const { titulo, descripcion, estado, prioridad } = req.body;
        const errorValidacion = validarFalla({ titulo, estado, prioridad });
        if (errorValidacion) return res.status(400).json({ error: errorValidacion });

        const id = await Falla.create(titulo, descripcion, estado, prioridad, req.usuario.id);

        await Historial.registrar(id, req.usuario.id, 'creacion', null, estado || 'reportada');

        res.status(201).json({
            id, titulo, descripcion,
            estado: estado || 'reportada',
            prioridad: prioridad || 'media',
            reportado_por: req.usuario.id
        });
    } catch (error) {
        console.error('[fallaController.createFalla]', error);
        res.status(500).json({ error: 'Error al crear la falla' });
    }
};

export const updateFalla = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, estado, prioridad } = req.body;

        const errorValidacion = validarFalla({ titulo, estado, prioridad });
        if (errorValidacion) return res.status(400).json({ error: errorValidacion });

        const fallaAnterior = await Falla.getById(id);
        if (!fallaAnterior) {
            return res.status(404).json({ error: `No existe una falla con ID ${id}` });
        }

        if (req.usuario.rol !== 'admin' && fallaAnterior.reportado_por !== req.usuario.id) {
            return res.status(403).json({ error: 'No tienes permiso para editar esta falla' });
        }

        const actualizado = await Falla.update(id, titulo, descripcion, estado, prioridad);
        if (!actualizado) {
            return res.status(404).json({ error: `No existe una falla con ID ${id}` });
        }

        const cambios = [];
        if (estado !== undefined && estado !== fallaAnterior.estado) {
            cambios.push({ campo: 'estado', anterior: fallaAnterior.estado, nuevo: estado });
        }
        if (prioridad !== undefined && prioridad !== fallaAnterior.prioridad) {
            cambios.push({ campo: 'prioridad', anterior: fallaAnterior.prioridad, nuevo: prioridad });
        }
        if (titulo !== undefined && titulo !== fallaAnterior.titulo) {
            cambios.push({ campo: 'titulo', anterior: fallaAnterior.titulo, nuevo: titulo });
        }

        for (const cambio of cambios) {
            try {
                await Historial.registrar(id, req.usuario.id, cambio.campo, cambio.anterior, cambio.nuevo);
            } catch (errorHistorial) {
                console.error('[fallaController.updateFalla] error al registrar historial:', errorHistorial);
            }
        }

        res.json({ message: 'Falla actualizada correctamente', id, titulo, descripcion, estado, prioridad });
    } catch (error) {
        console.error('[fallaController.updateFalla]', error);
        res.status(500).json({ error: 'Error al actualizar la falla' });
    }
};


export const resolverFalla = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion } = req.body;

        if (!descripcion || !descripcion.trim()) {
            return res.status(400).json({ error: 'Debes describir cómo se resolvió la falla' });
        }

        const fallaAnterior = await Falla.getById(id);
        if (!fallaAnterior) {
            return res.status(404).json({ error: `No existe una falla con ID ${id}` });
        }

        if (req.usuario.rol !== 'admin' && fallaAnterior.reportado_por !== req.usuario.id) {
            return res.status(403).json({ error: 'No tienes permiso para resolver esta falla' });
        }

        await Falla.update(id, fallaAnterior.titulo, fallaAnterior.descripcion, 'solucionada', fallaAnterior.prioridad);

       
        await Historial.registrar(id, req.usuario.id, 'estado', fallaAnterior.estado, 'solucionada');

        
        const archivoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const resolucionId = await Resolucion.registrar(id, req.usuario.id, descripcion, archivoUrl);

        res.json({
            message: 'Falla resuelta correctamente',
            id,
            estado: 'solucionada',
            resolucion: { id: resolucionId, descripcion, archivo_url: archivoUrl }
        });
    } catch (error) {
        console.error('[fallaController.resolverFalla]', error);
        res.status(500).json({ error: 'Error al resolver la falla' });
    }
};

export const deleteFalla = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await Falla.delete(id);

        if (!eliminado) {
            return res.status(404).json({ error: `No existe una falla con ID ${id}` });
        }

        res.json({ message: `Falla con ID ${id} eliminada` });
    } catch (error) {
        console.error('[fallaController.deleteFalla]', error);
        res.status(500).json({ error: 'Error al eliminar la falla' });
    }
};