const conversationService = require('../services/conversation.service');
const { VERIFY_TOKEN } = require('../config/whatsapp');

class WebhookController {

    // Verificación del webhook (GET)
    verify(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('✅ Webhook verificado correctamente');
                return res.status(200).send(challenge);
            }
        }

        console.log('❌ Verificación de webhook fallida');
        return res.sendStatus(403);
    }

    // Recibir mensajes (POST)
    async receiveMessage(req, res) {
        try {
            const body = req.body;

            // Verificar que es un evento de WhatsApp
            if (body.object !== 'whatsapp_business_account') {
                return res.sendStatus(404);
            }

            // Responder inmediatamente a Meta (evitar timeout)
            res.sendStatus(200);

            // Procesar el mensaje de forma asíncrona
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value?.messages) {
                return; // No hay mensajes, posiblemente es un status update
            }

            const message = value.messages[0];
            const from = message.from; // Número del remitente
            const messageId = message.id;

            // Extraer el contenido del mensaje según su tipo
            let messageContent = '';

            switch (message.type) {
                case 'text':
                    messageContent = message.text.body;
                    break;

                case 'interactive':
                    if (message.interactive.type === 'button_reply') {
                        messageContent = message.interactive.button_reply.title;
                    } else if (message.interactive.type === 'list_reply') {
                        // Obtener la descripción completa si existe, sino el título
                        messageContent = message.interactive.list_reply.description ||
                                        message.interactive.list_reply.title;
                    }
                    break;

                case 'button':
                    messageContent = message.button.text;
                    break;

                default:
                    messageContent = '[Tipo de mensaje no soportado]';
            }

            console.log(`📩 Mensaje recibido de ${from}: ${messageContent}`);

            // Procesar el mensaje
            await conversationService.handleMessage(from, messageContent, messageId);

        } catch (error) {
            console.error('Error en webhook:', error);
        }
    }
}

module.exports = new WebhookController();
