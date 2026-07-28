# Contexto del Proyecto: tickets-backend

## Descripción General

Sistema backend de gestión de tickets/reportes de bugs (fallas de software). Permite a usuarios reportar incidentes, rastrear su estado a través de un ciclo de vida, registrar historial de cambios y submitir resoluciones con archivos adjuntos (evidencia). Todo el código utiliza convenciones de nombres en español.

**Despliegue:** Railway (backend + base de datos MySQL)

**Frontend esperado:** Aplicación Vite en `localhost:5173` (configurable vía `CORS_ORIGIN`)

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | JavaScript (ES Modules) |
| Framework | Express.js v5.2.1 |
| Base de datos | MySQL (mysql2 v3.22.4, promise-based) |
| ORM | Ninguno (SQL raw parametrizado en todos los models) |
| Autenticación | JWT (jsonwebtoken v9.0.3) + bcryptjs v3.0.3 |
| Subida de archivos | Multer v2.2.0 (almacenamiento en disco, imágenes + PDFs, máx 5MB) |
| CORS | cors v2.8.6 |
| Variables de entorno | dotenv v17.4.2 |
| Dev tooling | nodemon v3.1.14 |

---

## Estructura del Proyecto

```
src/
├── app.js                          # Punto de entrada - Setup del servidor Express
├── config/
│   └── db.js                       # Pool de conexión MySQL
├── controllers/
│   ├── authController.js           # Registro, login, perfil
│   ├── fallaController.js          # CRUD + resolver tickets
│   ├── historialController.js      # Obtención de historial de cambios
│   └── resolucionController.js     # Obtención de resoluciones
├── middlewares/
│   ├── authMiddleware.js           # Verificación JWT + verificación de roles
│   └── uploadMiddleware.js         # Configuración de Multer para uploads
├── models/
│   ├── fallaModel.js               # Queries de la tabla `fallas`
│   ├── historialModel.js           # Queries de la tabla `historial_cambios`
│   ├── resolucionModel.js          # Queries de la tabla `resoluciones`
│   └── usuarioModel.js             # Queries de la tabla `usuarios`
└── routes/
    ├── authRoutes.js               # Rutas /api/auth/*
    └── fallaRoutes.js              # Rutas /api/fallas/*
```

---

## Punto de Entrada (`src/app.js`)

Al ejecutar `node src/app.js` (producción) o `nodemon src/app.js` (desarrollo):

1. Carga variables de entorno con `dotenv.config()`
2. Crea la aplicación Express
3. Configura CORS restringido a `CORS_ORIGIN` (default: `http://localhost:5173`)
4. Habilita parsing de JSON en el body
5. Sirve archivos subidos estáticamente en `/uploads`
6. Registra endpoint de health check en `GET /api/salud`
7. Monta las rutas:
   - `/api/auth` — rutas de autenticación
   - `/api/fallas` — rutas de gestión de tickets (todas requieren JWT)
8. Agrega handler de 404 para rutas no encontradas
9. Escucha en el `PORT` configurado (default: 5000)

---

## Variables de Entorno (`.env.example`)

```
PORT=5000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=nombre_base_datos
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=clave_secreta_para_jwt
```

---

## Base de Datos

**Nombre:** `tickets_software`
**Tipo:** MySQL (desplegado en Railway)
**Conexión:** Pool de 10 conexiones con soporte SSL opcional (`src/config/db.js`)

### Esquema Inferido (a partir de las queries SQL)

No existen archivos de migración ni ORM. El esquema se gestiona manualmente en MySQL.

#### Tabla `usuarios`
| Columna | Tipo inferido |
|---|---|
| id | INT AUTO_INCREMENT PK |
| nombre | VARCHAR |
| email | VARCHAR (unique) |
| password_hash | VARCHAR |
| rol | ENUM('admin', 'reportero') |
| fecha_creacion | DATETIME |

#### Tabla `fallas` (tickets/bugs)
| Columna | Tipo inferido |
|---|---|
| id | INT AUTO_INCREMENT PK |
| titulo | VARCHAR(255) |
| descripcion | TEXT |
| estado | ENUM('reportada', 'en solucion', 'solucionada') |
| prioridad | ENUM('baja', 'media', 'alta', 'critica') |
| reportado_por | INT FK → usuarios.id |
| fecha_creacion | DATETIME |

#### Tabla `historial_cambios`
| Columna | Tipo inferido |
|---|---|
| id | INT AUTO_INCREMENT PK |
| falla_id | INT FK → fallas.id |
| usuario_id | INT FK → usuarios.id |
| campo_modificado | VARCHAR |
| valor_anterior | VARCHAR |
| valor_nuevo | VARCHAR |
| fecha_cambio | DATETIME |

#### Tabla `resoluciones`
| Columna | Tipo inferido |
|---|---|
| id | INT AUTO_INCREMENT PK |
| falla_id | INT FK → fallas.id |
| usuario_id | INT FK → usuarios.id |
| descripcion | TEXT |
| archivo_url | VARCHAR (nullable) |
| fecha_resolucion | DATETIME |

---

## Endpoints de la API

### Autenticación (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | Ninguno | Registrar usuario nuevo (admin o reportero) |
| POST | `/api/auth/login` | Ninguno | Login, retorna JWT |
| GET | `/api/auth/perfil` | JWT | Obtener perfil del usuario actual |

### Tickets/Fallas (`/api/fallas`) — Todas requieren JWT

| Método | Ruta | Auth extra | Descripción |
|---|---|---|---|
| GET | `/api/fallas` | JWT | Listar todos los tickets (admin ve todos; reporteros ven solo los suyos) |
| GET | `/api/fallas/:id` | JWT | Obtener un ticket por ID |
| POST | `/api/fallas` | JWT | Crear un nuevo ticket |
| PUT | `/api/fallas/:id` | JWT | Actualizar un ticket |
| PUT | `/api/fallas/:id/resolver` | JWT + archivo | Resolver un ticket (descripción + archivo de evidencia opcional) |
| DELETE | `/api/fallas/:id` | JWT + admin | Eliminar un ticket (solo admin) |
| GET | `/api/fallas/:id/historial` | JWT | Obtener historial de cambios de un ticket |
| GET | `/api/fallas/:id/resoluciones` | JWT | Obtener resoluciones de un ticket |

---

## Arquitectura y Patrones

### Arquitectura MVC-like (API-only)
Separación en capas: `routes → controllers → models`. Sin capa de vistas ya que es un backend puro.

### SQL Raw Parametrizado
Todas las queries SQL están escritas a mano con `mysql2/promise`. No se usa ORM. Esto da control total sobre las queries pero implica que el esquema solo se define implícitamente en el código.

### Control de Acceso Basado en Roles (RBAC)
Dos roles:
- **admin**: Acceso completo, puede eliminar cualquier ticket
- **reportero**: Solo puede ver/editar/eliminar sus propios tickets

El middleware `verificarRol` es reutilizable y acepta cualquier cantidad de roles permitidos.

### Auditoría Completa
Cada actualización de un ticket registra automáticamente qué cambió (campo, valor anterior, valor nuevo) en la tabla `historial_cambios`, proporcionando un historial completo de cambios con el usuario que lo realizó.

### Subida de Archivos
Los archivos de evidencia (imágenes/PDFs) se suben al resolver un ticket, se almacenan en un directorio local `uploads/` con nombres únicos, y se sirven estáticamente.

### Seguridad de Contraseñas
- Contraseñas hasheadas con bcrypt (10 rounds)
- Longitud mínima de 8 caracteres (validada en la aplicación)
- Tokens JWT con expiración de 8 horas

### Validación de Datos
La validación de entrada (campos requeridos, enums válidos, formato de email, longitudes de string) se realiza manualmente en los controllers, sin librerías externas como Joi o Zod.

### Autorización Basada en Propiedad
Los usuarios no-admin solo pueden acceder a sus propios tickets. Esto se valida tanto en el controller (verificando que `reportado_por` coincida con el usuario solicitante) como en el model (filtrando por `usuarioId`).

---

## Despliegue en Railway

- Backend desplegado en Railway
- Base de datos MySQL desplegada en Railway
- No existen archivos de configuración de despliegue en el repositorio (Dockerfile, railway.json, etc.)
- Railway detecta el proyecto Node.js automáticamente por el `package.json`

---

## Notas Importantes

1. El archivo `.env` contiene credenciales reales y está committeado en el historial de git, aunque está en `.gitignore`
2. No existen tests automatizados
3. No hay herramientas de migración de base de datos
4. Express 5 trae soporte nativo de promises en los route handlers
5. El código completo está en español (nombres de variables, tablas, rutas, mensajes de error, comentarios)
