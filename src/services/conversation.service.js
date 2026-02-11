const { getPool } = require('../config/database');
const whatsappService = require('./whatsapp.service');
const { PREGUNTAS, MENSAJES } = require('../utils/questions');

class ConversationService {

    async getOrCreateUser(telefono) {
        const pool = getPool();

        const [rows] = await pool.execute(
            'SELECT * FROM usuarios WHERE telefono = ?',
            [telefono]
        );

        if (rows.length > 0) {
            return rows[0];
        }

        const [result] = await pool.execute(
            'INSERT INTO usuarios (telefono, estado_conversacion) VALUES (?, ?)',
            [telefono, 'inicio']
        );

        return {
            id: result.insertId,
            telefono: telefono,
            estado_conversacion: 'inicio'
        };
    }

    async updateUserState(userId, estado) {
        const pool = getPool();
        await pool.execute(
            'UPDATE usuarios SET estado_conversacion = ? WHERE id = ?',
            [estado, userId]
        );
    }

    async saveResponse(userId, preguntaNumero, preguntaTexto, respuesta) {
        const pool = getPool();
        await pool.execute(
            `INSERT INTO respuestas (usuario_id, pregunta_numero, pregunta_texto, respuesta)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE respuesta = ?, fecha_respuesta = CURRENT_TIMESTAMP`,
            [userId, preguntaNumero, preguntaTexto, respuesta, respuesta]
        );
    }

    async updateUserInfo(userId, campo, valor) {
        const pool = getPool();
        const camposPermitidos = ['nombre_completo', 'correo_electronico', 'programa_academico', 'semestre', 'edad'];

        if (!camposPermitidos.includes(campo)) {
            throw new Error(`Campo no permitido: ${campo}`);
        }

        await pool.execute(
            `UPDATE usuarios SET ${campo} = ? WHERE id = ?`,
            [valor, userId]
        );
    }

    async markAsCompleted(userId) {
        const pool = getPool();
        await pool.execute(
            'UPDATE usuarios SET completado = TRUE WHERE id = ?',
            [userId]
        );
    }

    async handleMessage(telefono, mensaje, messageId) {
        try {
            // Marcar mensaje como leído
            await whatsappService.markAsRead(messageId);

            // Obtener o crear usuario
            const user = await this.getOrCreateUser(telefono);

            // Procesar según el estado actual
            await this.processState(user, mensaje, telefono);

        } catch (error) {
            console.error('Error procesando mensaje:', error);
            await whatsappService.sendTextMessage(
                telefono,
                'Lo sentimos, ocurrió un error. Por favor intente nuevamente.'
            );
        }
    }

    async processState(user, mensaje, telefono) {
        const estado = user.estado_conversacion;

        switch (estado) {
            case 'inicio':
                await this.sendWelcome(telefono, user.id);
                break;

            case 'pregunta_1':
            case 'pregunta_2':
            case 'pregunta_3':
            case 'pregunta_4':
            case 'pregunta_5':
            case 'pregunta_6':
            case 'pregunta_7':
            case 'pregunta_8':
            case 'pregunta_9':
            case 'pregunta_10':
                await this.processQuestion(user, mensaje, telefono, estado);
                break;

            case 'pregunta_4_otro':
                await this.processOtroResponse(user, mensaje, telefono);
                break;

            case 'info_nombre':
                await this.processInfoNombre(user, mensaje, telefono);
                break;

            case 'info_correo':
                await this.processInfoCorreo(user, mensaje, telefono);
                break;

            case 'info_programa':
                await this.processInfoPrograma(user, mensaje, telefono);
                break;

            case 'info_semestre':
                await this.processInfoSemestre(user, mensaje, telefono);
                break;

            case 'info_edad':
                await this.processInfoEdad(user, mensaje, telefono);
                break;

            case 'completado':
                await whatsappService.sendTextMessage(
                    telefono,
                    'Ya ha completado su postulación. Será contactado(a) a través del correo electrónico registrado en caso de ser seleccionado(a). ¡Gracias!'
                );
                break;

            default:
                await this.sendWelcome(telefono, user.id);
        }
    }

    async sendWelcome(telefono, userId) {
        // Enviar mensaje de bienvenida
        await whatsappService.sendTextMessage(telefono, MENSAJES.BIENVENIDA);

        // Pequeña pausa antes del contexto
        await this.delay(1000);

        // Enviar contexto
        await whatsappService.sendTextMessage(telefono, MENSAJES.CONTEXTO);

        await this.delay(1000);

        // Actualizar estado y enviar primera pregunta
        await this.updateUserState(userId, 'pregunta_1');
        await this.sendQuestion(telefono, 1);
    }

    async sendQuestion(telefono, numeroP) {
        const pregunta = PREGUNTAS[numeroP];

        if (!pregunta) {
            console.error(`Pregunta ${numeroP} no encontrada`);
            return;
        }

        if (pregunta.tipo === 'opciones') {
            // Usar lista interactiva para preguntas con más de 3 opciones
            if (pregunta.opciones.length > 3) {
                const sections = [{
                    title: 'Opciones',
                    rows: pregunta.opciones.map((opcion, index) => ({
                        id: `opcion_${index}`,
                        title: opcion.length > 24 ? opcion.substring(0, 21) + '...' : opcion,
                        description: opcion.length > 24 ? opcion : ''
                    }))
                }];

                await whatsappService.sendInteractiveList(
                    telefono,
                    pregunta.texto,
                    'Ver opciones',
                    sections
                );
            } else {
                // Usar botones para 3 opciones o menos
                await whatsappService.sendInteractiveButtons(
                    telefono,
                    pregunta.texto,
                    pregunta.opciones
                );
            }
        } else if (pregunta.tipo === 'texto') {
            await whatsappService.sendTextMessage(telefono, pregunta.texto);
        }
    }

    async processQuestion(user, mensaje, telefono, estado) {
        const numeroP = parseInt(estado.split('_')[1]);
        const pregunta = PREGUNTAS[numeroP];

        // Guardar respuesta
        await this.saveResponse(user.id, numeroP, pregunta.texto, mensaje);

        // Caso especial para pregunta 4 con "Otro"
        if (numeroP === 4 && mensaje.toLowerCase().includes('otro')) {
            await this.updateUserState(user.id, 'pregunta_4_otro');
            await whatsappService.sendTextMessage(
                telefono,
                'Por favor, indique brevemente cuál sería el resultado más valioso para usted:'
            );
            return;
        }

        // Avanzar a siguiente pregunta o sección de información
        if (numeroP < 10) {
            const siguienteEstado = `pregunta_${numeroP + 1}`;
            await this.updateUserState(user.id, siguienteEstado);
            await this.sendQuestion(telefono, numeroP + 1);
        } else {
            // Después de pregunta 10, pedir información básica
            await this.updateUserState(user.id, 'info_nombre');
            await whatsappService.sendTextMessage(
                telefono,
                MENSAJES.INFO_BASICA + '\n\n📝 Por favor, escriba su *nombre completo*:'
            );
        }
    }

    async processOtroResponse(user, mensaje, telefono) {
        // Guardar la especificación del "otro"
        await this.saveResponse(user.id, 4.5, 'Especificación de Otro resultado', mensaje);

        // Continuar con pregunta 5
        await this.updateUserState(user.id, 'pregunta_5');
        await this.sendQuestion(telefono, 5);
    }

    async processInfoNombre(user, mensaje, telefono) {
        await this.updateUserInfo(user.id, 'nombre_completo', mensaje);
        await this.updateUserState(user.id, 'info_correo');
        await whatsappService.sendTextMessage(
            telefono,
            '📧 Ahora, escriba su *correo electrónico*:'
        );
    }

    async processInfoCorreo(user, mensaje, telefono) {
        // Validación básica de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(mensaje)) {
            await whatsappService.sendTextMessage(
                telefono,
                '⚠️ El correo electrónico no parece válido. Por favor, ingrese un correo válido (ejemplo: nombre@correo.com):'
            );
            return;
        }

        await this.updateUserInfo(user.id, 'correo_electronico', mensaje);
        await this.updateUserState(user.id, 'info_programa');
        await whatsappService.sendTextMessage(
            telefono,
            '🎓 Escriba su *programa académico* (ej: Tecnología en Producción Industrial, Ingeniería Industrial):'
        );
    }

    async processInfoPrograma(user, mensaje, telefono) {
        await this.updateUserInfo(user.id, 'programa_academico', mensaje);
        await this.updateUserState(user.id, 'info_semestre');
        await whatsappService.sendTextMessage(
            telefono,
            '📚 ¿En qué *semestre* se encuentra actualmente?'
        );
    }

    async processInfoSemestre(user, mensaje, telefono) {
        await this.updateUserInfo(user.id, 'semestre', mensaje);
        await this.updateUserState(user.id, 'info_edad');
        await whatsappService.sendTextMessage(
            telefono,
            '🎂 Por último, ¿cuál es su *edad*?'
        );
    }

    async processInfoEdad(user, mensaje, telefono) {
        await this.updateUserInfo(user.id, 'edad', mensaje);
        await this.markAsCompleted(user.id);
        await this.updateUserState(user.id, 'completado');

        await whatsappService.sendTextMessage(telefono, MENSAJES.CIERRE);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new ConversationService();
