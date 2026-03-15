require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const dbPool = require('./src/config/db');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.IO para WebSockets (Tiempo real)
const io = new Server(server, {
    cors: {
        origin: '*', // IMPORTANTE: En producción cambiar '*' por el dominio exacto del frontend
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

const port = process.env.PORT || 3000;

// ==========================================
// Inicializar Base de Datos (MIGRACIÓN AUTO)
// ==========================================
const initDatabase = async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        const sqlPath = path.join(__dirname, 'database', 'data', 'schema.sql');
        
        if (fs.existsSync(sqlPath)) {
            const sql = fs.readFileSync(sqlPath, 'utf8');
            await dbPool.query(sql);
            
            // Verificar qué tablas existen realmente
            const [tables] = await dbPool.query('SHOW TABLES');
            const tableNames = tables.map(t => Object.values(t)[0]);
            console.log('📦 Tablas actuales en la BD:', tableNames.join(', '));
            
            console.log('✅ Base de datos lista para operar.');
        }
    } catch (err) {
        console.error('❌ Error inicializando tablas:', err.message);
    }
};

// Middlewares Globales
app.use(cors());
app.use(express.json()); // Para parsear el body de las peticiones a JSON

// Probar conexión e inicializar tablas
dbPool.getConnection()
    .then(async (connection) => {
        console.log('✅ Conectado exitosamente a MySQL (Pool de conexiones)');
        connection.release();
        await initDatabase(); // Crear tablas si no existen
    })
    .catch(err => {
        console.error('❌ Error conectando a MySQL:', err.message);
    });

// Hacer 'io' accesible en los controladores si necesitamos emitir algo desde una ruta REST
app.set('io', io);

// ==========================================
// Inicializar WebSockets
// ==========================================
const setupSockets = require('./src/sockets/location.socket');
setupSockets(io);

// ==========================================
// Rutas (API REST)
// ==========================================
app.get('/', (req, res) => {
    res.send('Servidor API Rastreador en funcionamiento 🚀');
});

// Registrar todas las rutas modulares
const authRoutes = require('./src/routes/auth.routes');
const locationRoutes = require('./src/routes/location.routes');
const geofenceRoutes = require('./src/routes/geofence.routes');
const alertRoutes = require('./src/routes/alert.routes');
const reportRoutes = require('./src/routes/report.routes');
const clientRoutes = require('./src/routes/client.routes');
const userClientRoutes = require('./src/routes/user_client.routes');
const supervisorUserRoutes = require('./src/routes/supervisor_user.routes');
const consentRoutes = require('./src/routes/consent.routes');
const userRoutes = require('./src/routes/user.routes');

app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/user-clients', userClientRoutes);
app.use('/api/supervisor-users', supervisorUserRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/users', userRoutes);


// Iniciar servidor
server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Servidor escuchando en http://0.0.0.0:${port}`);
});
