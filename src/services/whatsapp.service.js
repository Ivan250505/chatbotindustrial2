const axios = require('axios');
const { WHATSAPP_TOKEN, PHONE_NUMBER_ID, API_VERSION, BASE_URL } = require('../config/whatsapp');

class WhatsAppService {
    constructor() {
        this.apiUrl = `${BASE_URL}/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
        this.headers = {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
        };
    }

    async sendTextMessage(to, text) {
        try {
            const response = await axios.post(this.apiUrl, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: { body: text }
            }, { headers: this.headers });

            return response.data;
        } catch (error) {
            console.error('Error enviando mensaje de texto:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendInteractiveButtons(to, bodyText, buttons) {
        try {
            const formattedButtons = buttons.map((btn, index) => ({
                type: 'reply',
                reply: {
                    id: `btn_${index}`,
                    title: btn.length > 20 ? btn.substring(0, 20) : btn
                }
            }));

            const response = await axios.post(this.apiUrl, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: { text: bodyText },
                    action: { buttons: formattedButtons }
                }
            }, { headers: this.headers });

            return response.data;
        } catch (error) {
            console.error('Error enviando botones:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendInteractiveList(to, bodyText, buttonText, sections) {
        try {
            const response = await axios.post(this.apiUrl, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'interactive',
                interactive: {
                    type: 'list',
                    body: { text: bodyText },
                    action: {
                        button: buttonText,
                        sections: sections
                    }
                }
            }, { headers: this.headers });

            return response.data;
        } catch (error) {
            console.error('Error enviando lista:', error.response?.data || error.message);
            throw error;
        }
    }

    async markAsRead(messageId) {
        try {
            await axios.post(this.apiUrl, {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            }, { headers: this.headers });
        } catch (error) {
            console.error('Error marcando mensaje como leído:', error.response?.data || error.message);
        }
    }
}

module.exports = new WhatsAppService();
