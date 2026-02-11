const mysql = require('mysql2/promise');

let pool = null;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function initDatabase() {
    try {
        pool = mysql.createPool(dbConfig);

        // Verificar conexión
        const connection = await pool.getConnection();
        console.log('📊 Conexión a MySQL establecida');
        connection.release();

        // Crear tablas si no existen
        await createTables();

        return pool;
    } catch (error) {
        console.error('Error conectando a MySQL:', error.message);
        throw error;
    }
}

async function createTables() {
    const createUsuariosTable = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            telefono VARCHAR(20) UNIQUE NOT NULL,
            nombre_completo VARCHAR(255),
            correo_electronico VARCHAR(255),
            programa_academico VARCHAR(255),
            semestre VARCHAR(50),
            edad VARCHAR(10),
            estado_conversacion VARCHAR(50) DEFAULT 'inicio',
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            completado BOOLEAN DEFAULT FALSE
        )
    `;

    const createRespuestasTable = `
        CREATE TABLE IF NOT EXISTS respuestas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            pregunta_numero INT NOT NULL,
            pregunta_texto TEXT,
            respuesta TEXT,
            fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            UNIQUE KEY unique_respuesta (usuario_id, pregunta_numero)
        )
    `;

    try {
        await pool.execute(createUsuariosTable);
        await pool.execute(createRespuestasTable);
        console.log('📋 Tablas verificadas/creadas correctamente');
    } catch (error) {
        console.error('Error creando tablas:', error.message);
        throw error;
    }
}

function getPool() {
    if (!pool) {
        throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
    }
    return pool;
}

module.exports = {
    initDatabase,
    getPool
};
