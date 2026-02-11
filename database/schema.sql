-- ============================================
-- ESQUEMA DE BASE DE DATOS
-- Chatbot Jóvenes Consultores - UTS
-- ============================================

-- Crear base de datos (ejecutar si no existe)
CREATE DATABASE IF NOT EXISTS chatbot_consultores
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE chatbot_consultores;

-- ============================================
-- TABLA: usuarios
-- Almacena información de los postulantes
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telefono VARCHAR(20) UNIQUE NOT NULL COMMENT 'Número de WhatsApp del usuario',
    nombre_completo VARCHAR(255) COMMENT 'Nombre completo del postulante',
    correo_electronico VARCHAR(255) COMMENT 'Correo electrónico de contacto',
    programa_academico VARCHAR(255) COMMENT 'Programa que estudia',
    semestre VARCHAR(50) COMMENT 'Semestre actual',
    edad VARCHAR(10) COMMENT 'Edad del postulante',
    estado_conversacion VARCHAR(50) DEFAULT 'inicio' COMMENT 'Estado actual del flujo conversacional',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de primer contacto',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completado BOOLEAN DEFAULT FALSE COMMENT 'Indica si completó todo el formulario',
    INDEX idx_telefono (telefono),
    INDEX idx_estado (estado_conversacion),
    INDEX idx_completado (completado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: respuestas
-- Almacena las respuestas a cada pregunta
-- ============================================
CREATE TABLE IF NOT EXISTS respuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    pregunta_numero DECIMAL(3,1) NOT NULL COMMENT 'Número de pregunta (4.5 para "otro")',
    pregunta_texto TEXT COMMENT 'Texto de la pregunta',
    respuesta TEXT COMMENT 'Respuesta del usuario',
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_respuesta (usuario_id, pregunta_numero),
    INDEX idx_usuario (usuario_id),
    INDEX idx_pregunta (pregunta_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VISTA: postulaciones_completas
-- Vista útil para consultar postulaciones
-- ============================================
CREATE OR REPLACE VIEW postulaciones_completas AS
SELECT
    u.id,
    u.nombre_completo,
    u.correo_electronico,
    u.telefono,
    u.programa_academico,
    u.semestre,
    u.edad,
    u.fecha_registro,
    u.completado,
    COUNT(r.id) as total_respuestas
FROM usuarios u
LEFT JOIN respuestas r ON u.id = r.usuario_id
WHERE u.completado = TRUE
GROUP BY u.id
ORDER BY u.fecha_registro DESC;

-- ============================================
-- CONSULTAS ÚTILES
-- ============================================

-- Ver todas las postulaciones completas
-- SELECT * FROM postulaciones_completas;

-- Ver respuestas de un usuario específico
-- SELECT r.pregunta_numero, r.pregunta_texto, r.respuesta
-- FROM respuestas r
-- JOIN usuarios u ON r.usuario_id = u.id
-- WHERE u.telefono = '573001234567'
-- ORDER BY r.pregunta_numero;

-- Estadísticas generales
-- SELECT
--     COUNT(*) as total_usuarios,
--     SUM(CASE WHEN completado = TRUE THEN 1 ELSE 0 END) as completados,
--     SUM(CASE WHEN completado = FALSE THEN 1 ELSE 0 END) as incompletos
-- FROM usuarios;
