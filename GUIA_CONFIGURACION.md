# Guía de Configuración y Despliegue
## Chatbot WhatsApp - Programa de Jóvenes Consultores UTS

---

## Índice
1. [Requisitos Previos](#1-requisitos-previos)
2. [Configuración de Meta Developer](#2-configuración-de-meta-developer)
3. [Configuración de MySQL en la Nube](#3-configuración-de-mysql-en-la-nube)
4. [Configuración del Proyecto Local](#4-configuración-del-proyecto-local)
5. [Despliegue en la Nube](#5-despliegue-en-la-nube)
6. [Configuración del Webhook](#6-configuración-del-webhook)
7. [Pruebas y Verificación](#7-pruebas-y-verificación)

---

## 1. Requisitos Previos

### Software necesario:
- Node.js v18 o superior
- npm (incluido con Node.js)
- Git
- Cuenta de Facebook/Meta
- Cuenta de negocio verificada en Facebook

### Cuentas en servicios cloud (elegir uno):
- Railway, Render, Heroku, o DigitalOcean (para hosting)
- PlanetScale, Railway MySQL, o AWS RDS (para base de datos)

---

## 2. Configuración de Meta Developer

### Paso 2.1: Crear App en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Inicia sesión con tu cuenta de Facebook
3. Click en **"My Apps"** → **"Create App"**
4. Selecciona **"Business"** como tipo de app
5. Completa:
   - **App name**: "Chatbot Jóvenes Consultores"
   - **App contact email**: tu correo
   - **Business Account**: selecciona o crea una
6. Click en **"Create App"**

### Paso 2.2: Agregar WhatsApp a la App

1. En el Dashboard de tu app, busca **"WhatsApp"** en productos
2. Click en **"Set up"**
3. Acepta los términos de servicio de WhatsApp Business

### Paso 2.3: Configurar número de teléfono

**Opción A: Usar número de prueba (recomendado para desarrollo)**
1. En WhatsApp → Getting Started, verás un número de prueba
2. Agrega hasta 5 números de prueba para enviar mensajes

**Opción B: Agregar tu propio número de negocio**
1. Ve a WhatsApp → Phone Numbers
2. Click en **"Add phone number"**
3. Selecciona tu Business Account
4. Agrega y verifica tu número con código SMS

### Paso 2.4: Obtener credenciales

En **WhatsApp → API Setup**, encontrarás:

1. **Phone number ID**: Copia el ID (ej: `123456789012345`)
2. **WhatsApp Business Account ID**: Anótalo
3. **Temporary access token**: Click en "Generate" (válido 24h)

### Paso 2.5: Crear Token Permanente

1. Ve a **Business Settings** → **System Users**
2. Click en **"Add"** → Crea un usuario del sistema
3. Asigna el rol **"Admin"**
4. Click en **"Generate new token"**
5. Selecciona la app del chatbot
6. Marca los permisos:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
7. **Copia y guarda el token** (solo se muestra una vez)

### Paso 2.6: Crear VERIFY_TOKEN

El `VERIFY_TOKEN` es una cadena secreta que tú creas. Ejemplos:
- `mi_token_secreto_uts_2024`
- `chatbot_consultores_verify_xyz123`

**Guárdalo, lo necesitarás después.**

---

## 3. Configuración de MySQL en la Nube

### Opción A: PlanetScale (Recomendado - Plan gratuito disponible)

1. Ve a [PlanetScale](https://planetscale.com/)
2. Crea una cuenta y un nuevo database
3. Nombre: `chatbot_consultores`
4. Región: la más cercana a tu servidor
5. En **"Connect"** selecciona **"Node.js"**
6. Copia las credenciales:
   ```
   DB_HOST=aws.connect.psdb.cloud
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   DB_NAME=chatbot_consultores
   ```

### Opción B: Railway MySQL

1. Ve a [Railway](https://railway.app/)
2. Crea un nuevo proyecto
3. Click en **"Add Service"** → **"Database"** → **"MySQL"**
4. En la pestaña **"Variables"**, copia:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

### Opción C: AWS RDS

1. Accede a AWS Console → RDS
2. Crea una instancia MySQL (Free Tier disponible)
3. Configura security groups para acceso público
4. Obtén el endpoint y credenciales

### Crear las tablas

Ejecuta el archivo `database/schema.sql` en tu base de datos:
- En PlanetScale: usa la consola web
- En otros: usa MySQL Workbench o línea de comandos

---

## 4. Configuración del Proyecto Local

### Paso 4.1: Instalar dependencias

```bash
cd C:\Users\Lenovo\Documents\Chatbot_Industrial
npm install
```

### Paso 4.2: Configurar variables de entorno

1. Copia el archivo de ejemplo:
```bash
copy .env.example .env
```

2. Edita `.env` con tus credenciales:
```env
# WhatsApp
WHATSAPP_TOKEN=tu_token_permanente_de_meta
PHONE_NUMBER_ID=tu_phone_number_id
VERIFY_TOKEN=tu_verify_token_personalizado

# Base de datos
DB_HOST=tu_host_mysql
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=chatbot_consultores
DB_PORT=3306

# Servidor
PORT=3000
NODE_ENV=development
```

### Paso 4.3: Probar localmente

```bash
npm run dev
```

Deberías ver:
```
📊 Conexión a MySQL establecida
📋 Tablas verificadas/creadas correctamente
✅ Base de datos conectada correctamente
🚀 Servidor corriendo en puerto 3000
📱 Webhook URL: http://localhost:3000/webhook
```

---

## 5. Despliegue en la Nube

### Opción A: Railway (Recomendado)

1. Ve a [Railway](https://railway.app/)
2. Conecta tu repositorio de GitHub (sube el código primero)
3. Railway detectará Node.js automáticamente
4. Agrega las variables de entorno en **Settings → Variables**
5. Railway te dará una URL como: `https://tu-app.railway.app`

### Opción B: Render

1. Ve a [Render](https://render.com/)
2. Crea un nuevo **Web Service**
3. Conecta tu repositorio
4. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Agrega las variables de entorno
6. URL: `https://tu-app.onrender.com`

### Opción C: Heroku

```bash
# Instalar Heroku CLI
heroku login
heroku create chatbot-jovenes-consultores
heroku config:set WHATSAPP_TOKEN=xxx PHONE_NUMBER_ID=xxx ...
git push heroku main
```

---

## 6. Configuración del Webhook

### Paso 6.1: Configurar webhook en Meta

1. Ve a tu app en [Meta Developers](https://developers.facebook.com/)
2. WhatsApp → **Configuration**
3. En **Webhook**, click en **"Edit"**
4. Ingresa:
   - **Callback URL**: `https://TU-DOMINIO.com/webhook`
   - **Verify token**: El mismo que pusiste en `VERIFY_TOKEN`
5. Click en **"Verify and save"**

### Paso 6.2: Suscribirse a eventos

1. En la misma sección, click en **"Manage"**
2. Suscríbete a:
   - `messages` ✅

### Paso 6.3: Verificar webhook

Si todo está correcto, verás un check verde ✅

Si falla:
- Verifica que tu servidor esté corriendo
- Verifica que el `VERIFY_TOKEN` coincida
- Revisa los logs de tu servidor

---

## 7. Pruebas y Verificación

### Paso 7.1: Crear link Click-to-Chat

Formato del link:
```
https://wa.me/NUMERO_SIN_MAS?text=Hola
```

Ejemplo:
```
https://wa.me/573001234567?text=Hola
```

### Paso 7.2: Probar el chatbot

1. Abre el link desde tu teléfono
2. Envía cualquier mensaje
3. Deberías recibir el mensaje de bienvenida
4. Completa las 10 preguntas y datos personales

### Paso 7.3: Verificar datos en la BD

Ejecuta esta consulta para ver postulaciones:
```sql
SELECT * FROM postulaciones_completas;
```

---

## Solución de Problemas Comunes

### Error: "Token expirado"
- Genera un nuevo token permanente en Meta Business

### Error: "Webhook verification failed"
- Verifica que VERIFY_TOKEN sea idéntico en código y Meta
- Asegúrate que el servidor esté accesible públicamente

### Error: "Message failed to send"
- Verifica que el número destino esté en la lista de prueba
- O que hayas verificado tu número de negocio

### Error: "Database connection failed"
- Verifica credenciales en .env
- Asegúrate que la IP del servidor esté permitida en el firewall de MySQL

---

## Estructura del Proyecto

```
Chatbot_Industrial/
├── src/
│   ├── config/
│   │   ├── database.js      # Conexión MySQL
│   │   └── whatsapp.js      # Config WhatsApp API
│   ├── controllers/
│   │   └── webhook.controller.js
│   ├── services/
│   │   ├── whatsapp.service.js
│   │   └── conversation.service.js
│   ├── routes/
│   │   └── webhook.routes.js
│   ├── utils/
│   │   └── questions.js     # Preguntas del chatbot
│   └── index.js             # Punto de entrada
├── database/
│   └── schema.sql           # Esquema de BD
├── .env.example
├── package.json
└── GUIA_CONFIGURACION.md
```

---

## Contacto y Soporte

Para dudas sobre la implementación técnica, revisar la documentación oficial:
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta for Developers](https://developers.facebook.com/)

---

*Documento generado para el Programa de Jóvenes Consultores Empresariales - UTS*
