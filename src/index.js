require('dotenv').config();

const express = require('express');
const webhookRoutes = require('./routes/webhook.routes');
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rutas del webhook de WhatsApp
app.use('/webhook', webhookRoutes);

// Ruta de health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Chatbot Jóvenes Consultores - UTS',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
async function startServer() {
    try {
        // Inicializar conexión a base de datos
        await initDatabase();
        console.log('✅ Base de datos conectada correctamente');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

startServer();
