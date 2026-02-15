const { getPool } = require('../config/database');
const whatsappService = require('./whatsapp.service');
const { PREGUNTAS, MENSAJES } = require('../utils/questions');

class ConversationService {

    // ==================== METODOS DE BASE DE DATOS ====================

    async getOrCreateUser(telefono) {
        console.log('   🔍 Buscando usuario con telefono:', telefono);
        const pool = getPool();

        const [rows] = await pool.execute(
            'SELECT * FROM usuarios WHERE telefono = ?',
            [telefono]
        );

        if (rows.length > 0) {
            console.log('   ✅ Usuario existente encontrado, ID:', rows[0].id);
            return rows[0];
        }

        console.log('   🆕 Usuario no existe, creando nuevo...');
        const [result] = await pool.execute(
            'INSERT INTO usuarios (telefono, estado_conversacion) VALUES (?, ?)',
            [telefono, 'inicio']
        );

        console.log('   ✅ Nuevo usuario creado, ID:', result.insertId);
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

    async getUserResponses(userId) {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT pregunta_numero, pregunta_texto, respuesta FROM respuestas WHERE usuario_id = ? AND pregunta_numero BETWEEN 1 AND 10 ORDER BY pregunta_numero',
            [userId]
        );
        return rows;
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

    // ==================== HANDLER PRINCIPAL ====================

    async handleMessage(telefono, mensaje, messageId, messageType, interactiveId) {
        console.log('');
        console.log('🤖 CONVERSATION SERVICE - handleMessage');
        console.log('   Telefono:', telefono);
        console.log('   Mensaje:', mensaje);
        console.log('   MessageId:', messageId);
        console.log('   MessageType:', messageType);
        console.log('   InteractiveId:', interactiveId);

        try {
            console.log('   📖 Marcando mensaje como leído...');
            await whatsappService.markAsRead(messageId);
            console.log('   ✅ Mensaje marcado como leído');

            console.log('   👤 Obteniendo/creando usuario...');
            const user = await this.getOrCreateUser(telefono);
            console.log('   ✅ Usuario:', JSON.stringify(user));

            console.log('   🔄 Procesando estado...');
            await this.processState(user, mensaje, telefono, messageType, interactiveId);
            console.log('   ✅ Estado procesado');

        } catch (error) {
            console.log('');
            console.log('   ❌❌❌ ERROR EN handleMessage ❌❌❌');
            console.error('   Mensaje:', error.message);
            console.error('   Stack:', error.stack);

            try {
                await whatsappService.sendTextMessage(
                    telefono,
                    'Lo sentimos, ocurrió un error. Por favor intente nuevamente.'
                );
            } catch (sendError) {
                console.error('   Error enviando mensaje de error:', sendError.message);
            }
        }
    }

    // ==================== MAQUINA DE ESTADOS ====================

    async processState(user, mensaje, telefono, messageType, interactiveId) {
        const estado = user.estado_conversacion;
        console.log('   📍 Estado actual:', estado);

        // Manejar estados de corrección dinámicamente
        if (estado.startsWith('corregir_')) {
            if (estado === 'corregir_4_otro') {
                await this.processCorregirOtro(user, mensaje, telefono);
            } else {
                await this.processCorreccionPregunta(user, mensaje, telefono, estado, messageType, interactiveId);
            }
            return;
        }

        switch (estado) {
            case 'inicio':
                await this.sendWelcome(telefono, user.id);
                break;

            case 'aceptacion':
                await this.processAceptacion(user, mensaje, telefono, messageType, interactiveId);
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
                await this.processQuestion(user, mensaje, telefono, estado, messageType, interactiveId);
                break;

            case 'pregunta_4_otro':
                await this.processOtroResponse(user, mensaje, telefono);
                break;

            case 'revision':
                await this.processRevision(user, mensaje, telefono, messageType, interactiveId);
                break;

            case 'seleccionar_correccion':
                await this.processSeleccionCorreccion(user, mensaje, telefono, messageType, interactiveId);
                break;

            case 'info_nombre':
                await this.processInfoNombre(user, mensaje, telefono);
                break;

            case 'info_correo':
                await this.processInfoCorreo(user, mensaje, telefono);
                break;

            case 'info_programa':
                await this.processInfoPrograma(user, mensaje, telefono, messageType, interactiveId);
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

    // ==================== BIENVENIDA Y ACEPTACION ====================

    async sendWelcome(telefono, userId) {
        console.log('   🎉 Enviando BIENVENIDA a', telefono);

        await whatsappService.sendTextMessage(telefono, MENSAJES.BIENVENIDA);
        console.log('   ✅ Mensaje de bienvenida enviado');

        await this.delay(1000);

        console.log('   📋 Enviando botón de aceptación...');
        await whatsappService.sendInteractiveButtons(
            telefono,
            MENSAJES.CONTEXTO + '\n\n¿Acepta los términos y condiciones para iniciar?',
            ['Acepto e inicio']
        );
        console.log('   ✅ Botón de aceptación enviado');

        await this.updateUserState(userId, 'aceptacion');
    }

    async processAceptacion(user, mensaje, telefono, messageType, interactiveId) {
        if (messageType === 'interactive' && interactiveId === 'btn_0') {
            console.log('   ✅ Usuario aceptó términos');
            await this.updateUserState(user.id, 'pregunta_1');
            await this.delay(500);
            await this.sendQuestion(telefono, 1);
        } else {
            await whatsappService.sendTextMessage(
                telefono,
                'Para continuar, por favor presione el botón *"Acepto e inicio"*.'
            );
        }
    }

    // ==================== PREGUNTAS ====================

    async sendQuestion(telefono, numeroP) {
        const pregunta = PREGUNTAS[numeroP];

        if (!pregunta) {
            console.error(`Pregunta ${numeroP} no encontrada`);
            return;
        }

        if (pregunta.tipo === 'opciones') {
            if (pregunta.opciones.length > 3) {
                const sections = [{
                    title: 'Opciones',
                    rows: pregunta.opciones.map((opcion, index) => ({
                        id: `opcion_${index}`,
                        title: pregunta.titulos ? pregunta.titulos[index] : (opcion.length > 24 ? opcion.substring(0, 21) + '...' : opcion),
                        description: opcion.length > 72 ? opcion.substring(0, 69) + '...' : opcion
                    }))
                }];

                await whatsappService.sendInteractiveList(
                    telefono,
                    pregunta.texto,
                    'Ver opciones',
                    sections
                );
            } else {
                await whatsappService.sendInteractiveButtons(
                    telefono,
                    pregunta.texto,
                    pregunta.titulos || pregunta.opciones
                );
            }
        } else if (pregunta.tipo === 'texto') {
            await whatsappService.sendTextMessage(telefono, pregunta.texto);
        }
    }

    // Resuelve el texto original de la opción a partir de la selección interactiva
    resolveResponse(pregunta, mensaje, messageType, interactiveId) {
        if (pregunta.tipo !== 'opciones') {
            return mensaje;
        }

        if (messageType === 'interactive' && interactiveId) {
            const idPrefix = interactiveId.startsWith('opcion_') ? 'opcion_' : 'btn_';
            const index = parseInt(interactiveId.replace(idPrefix, ''));
            if (!isNaN(index) && pregunta.opciones[index]) {
                return pregunta.opciones[index];
            }
        }

        return mensaje;
    }

    // Valida que la respuesta sea válida para preguntas con opciones
    validateOptionResponse(pregunta, mensaje, messageType, numeroP) {
        // Preguntas de texto libre siempre son válidas
        if (pregunta.tipo === 'texto') return true;

        // Selecciones interactivas siempre son válidas
        if (messageType === 'interactive') return true;

        // Excepción: Pregunta 3 acepta texto libre
        if (numeroP === 3) return true;

        // Para mensajes de texto en preguntas con opciones, validar contra las opciones
        if (messageType === 'text' && pregunta.tipo === 'opciones') {
            const matchedOption = pregunta.opciones.find(
                op => op.toLowerCase().trim() === mensaje.toLowerCase().trim()
            );
            return !!matchedOption;
        }

        return true;
    }

    async processQuestion(user, mensaje, telefono, estado, messageType, interactiveId) {
        const numeroP = parseInt(estado.split('_')[1]);
        const pregunta = PREGUNTAS[numeroP];

        // Validar respuesta
        if (!this.validateOptionResponse(pregunta, mensaje, messageType, numeroP)) {
            await whatsappService.sendTextMessage(
                telefono,
                'Por favor, selecciona o escribe una de las opciones válidas para continuar.'
            );
            return;
        }

        // Resolver texto completo de la opción
        const respuestaFinal = this.resolveResponse(pregunta, mensaje, messageType, interactiveId);

        // Caso especial para Pregunta 4 "Otro"
        if (numeroP === 4 && respuestaFinal.toLowerCase().includes('otro')) {
            await this.saveResponse(user.id, numeroP, pregunta.texto, respuestaFinal);
            await this.updateUserState(user.id, 'pregunta_4_otro');
            await whatsappService.sendTextMessage(
                telefono,
                'Por favor, indique brevemente cuál sería el resultado más valioso para usted:'
            );
            return;
        }

        // Guardar respuesta
        await this.saveResponse(user.id, numeroP, pregunta.texto, respuestaFinal);

        // Avanzar a siguiente pregunta o ir a revisión
        if (numeroP < 10) {
            const siguienteEstado = `pregunta_${numeroP + 1}`;
            await this.updateUserState(user.id, siguienteEstado);
            await this.sendQuestion(telefono, numeroP + 1);
        } else {
            // Después de la Pregunta 10, ir a revisión
            await this.updateUserState(user.id, 'revision');
            await this.sendSummary(telefono, user.id);
        }
    }

    async processOtroResponse(user, mensaje, telefono) {
        const pregunta = PREGUNTAS[4];
        await this.saveResponse(user.id, 4, pregunta.texto, `Otro resultado: ${mensaje}`);

        await this.updateUserState(user.id, 'pregunta_5');
        await this.sendQuestion(telefono, 5);
    }

    // ==================== REVISION Y CORRECCION ====================

    async sendSummary(telefono, userId) {
        const responses = await this.getUserResponses(userId);

        let summary = '📋 *Resumen de sus respuestas:*\n\n';

        for (const resp of responses) {
            const questionText = resp.pregunta_texto.replace(/\*Pregunta \d+ de \d+\*\n\n/, '');
            summary += `*${resp.pregunta_numero}.* ${questionText}\n`;
            summary += `➡️ ${resp.respuesta}\n\n`;
        }

        await whatsappService.sendTextMessage(telefono, summary);

        await this.delay(1000);

        await whatsappService.sendInteractiveButtons(
            telefono,
            '¿Es correcta esta información o deseas corregir alguna respuesta?',
            ['Sí, es correcta', 'Corregir respuesta']
        );
    }

    async processRevision(user, mensaje, telefono, messageType, interactiveId) {
        if (messageType === 'interactive') {
            if (interactiveId === 'btn_0') {
                // "Sí, es correcta" → continuar a datos personales
                console.log('   ✅ Usuario confirmó respuestas');
                await this.updateUserState(user.id, 'info_nombre');
                await whatsappService.sendTextMessage(
                    telefono,
                    MENSAJES.INFO_BASICA + '\n\n📝 Por favor, escriba su *nombre completo*:'
                );
            } else if (interactiveId === 'btn_1') {
                // "Corregir respuesta" → mostrar lista de preguntas
                console.log('   🔄 Usuario quiere corregir respuestas');
                await this.updateUserState(user.id, 'seleccionar_correccion');
                await this.sendCorrectionList(telefono);
            }
        } else {
            await whatsappService.sendTextMessage(
                telefono,
                'Por favor, seleccione una de las opciones disponibles.'
            );
        }
    }

    async sendCorrectionList(telefono) {
        const rows = [];
        for (let i = 1; i <= 10; i++) {
            const pregunta = PREGUNTAS[i];
            rows.push({
                id: `corregir_${i}`,
                title: `Pregunta ${i}`,
                description: pregunta.categoria.length > 72 ? pregunta.categoria.substring(0, 69) + '...' : pregunta.categoria
            });
        }

        const sections = [{
            title: 'Preguntas',
            rows: rows
        }];

        await whatsappService.sendInteractiveList(
            telefono,
            '¿Cuál pregunta desea corregir?',
            'Ver preguntas',
            sections
        );
    }

    async processSeleccionCorreccion(user, mensaje, telefono, messageType, interactiveId) {
        if (messageType === 'interactive' && interactiveId && interactiveId.startsWith('corregir_')) {
            const numeroP = parseInt(interactiveId.replace('corregir_', ''));
            if (numeroP >= 1 && numeroP <= 10) {
                console.log(`   🔄 Corrigiendo pregunta ${numeroP}`);
                await this.updateUserState(user.id, `corregir_${numeroP}`);
                await this.sendQuestion(telefono, numeroP);
                return;
            }
        }

        await whatsappService.sendTextMessage(
            telefono,
            'Por favor, seleccione el número de la pregunta que desea corregir.'
        );
    }

    async processCorreccionPregunta(user, mensaje, telefono, estado, messageType, interactiveId) {
        const numeroP = parseInt(estado.replace('corregir_', ''));
        const pregunta = PREGUNTAS[numeroP];

        // Validar respuesta
        if (!this.validateOptionResponse(pregunta, mensaje, messageType, numeroP)) {
            await whatsappService.sendTextMessage(
                telefono,
                'Por favor, selecciona o escribe una de las opciones válidas para continuar.'
            );
            return;
        }

        const respuestaFinal = this.resolveResponse(pregunta, mensaje, messageType, interactiveId);

        // Caso especial para Q4 "Otro"
        if (numeroP === 4 && respuestaFinal.toLowerCase().includes('otro')) {
            await this.saveResponse(user.id, numeroP, pregunta.texto, respuestaFinal);
            await this.updateUserState(user.id, 'corregir_4_otro');
            await whatsappService.sendTextMessage(
                telefono,
                'Por favor, indique brevemente cuál sería el resultado más valioso para usted:'
            );
            return;
        }

        // Guardar respuesta corregida
        await this.saveResponse(user.id, numeroP, pregunta.texto, respuestaFinal);

        // Volver a revisión
        await this.updateUserState(user.id, 'revision');
        await this.sendSummary(telefono, user.id);
    }

    async processCorregirOtro(user, mensaje, telefono) {
        const pregunta = PREGUNTAS[4];
        await this.saveResponse(user.id, 4, pregunta.texto, `Otro resultado: ${mensaje}`);

        await this.updateUserState(user.id, 'revision');
        await this.sendSummary(telefono, user.id);
    }

    // ==================== INFORMACION PERSONAL ====================

    async processInfoNombre(user, mensaje, telefono) {
        await this.updateUserInfo(user.id, 'nombre_completo', mensaje);
        await this.updateUserState(user.id, 'info_correo');
        await whatsappService.sendTextMessage(
            telefono,
            '📧 Ahora, escriba su *correo electrónico*:'
        );
    }

    async processInfoCorreo(user, mensaje, telefono) {
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
        await whatsappService.sendInteractiveButtons(
            telefono,
            '🎓 Seleccione su *programa académico*:',
            ['Tec. Producción Ind.', 'Ing. de Sistemas']
        );
    }

    async processInfoPrograma(user, mensaje, telefono, messageType, interactiveId) {
        const programas = [
            'Tecnología en Producción Industrial',
            'Ingeniería de Sistemas'
        ];

        let programa = null;

        if (messageType === 'interactive') {
            if (interactiveId === 'btn_0') {
                programa = programas[0];
            } else if (interactiveId === 'btn_1') {
                programa = programas[1];
            }
        }

        if (!programa) {
            await whatsappService.sendTextMessage(
                telefono,
                'Por favor, seleccione una de las opciones disponibles.'
            );
            return;
        }

        await this.updateUserInfo(user.id, 'programa_academico', programa);
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

    // ==================== UTILIDADES ====================

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new ConversationService();
