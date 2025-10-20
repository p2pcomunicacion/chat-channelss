# 🔐 Chat Privado con Códigos - Pusher

Sistema de chat en tiempo real con canales privados usando códigos de 6 dígitos.

## 🚀 Características

- ✅ **Canales privados con códigos** - Comparte un código de 6 dígitos para invitar
- ✅ **Mensajes en tiempo real** - Usando Pusher Channels con presencia
- ✅ **Sistema de autenticación** - Control de acceso por usuario
- ✅ **Interfaz moderna** - UI/UX limpia y responsive
- ✅ **Historial de mensajes** - Guarda los últimos 100 mensajes por canal

## 📦 Instalación Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

1. Copia el archivo de ejemplo:
```bash
cp env.example .env
```

2. Edita el archivo `.env` con tus credenciales de Pusher:
```env
PUSHER_APP_ID=tu_app_id_aqui
PUSHER_KEY=tu_key_aqui
PUSHER_SECRET=tu_secret_aqui
PUSHER_CLUSTER=tu_cluster_aqui
PORT=3000
```

### 3. Ejecutar el servidor

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## ☁️ Deploy en Vercel

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Configurar variables de entorno en Vercel

```bash
vercel env add PUSHER_APP_ID
vercel env add PUSHER_KEY
vercel env add PUSHER_SECRET
vercel env add PUSHER_CLUSTER
```

### 3. Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### 4. Configurar en el Dashboard de Vercel

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Settings → Environment Variables
3. Agrega las variables:
   - `PUSHER_APP_ID`
   - `PUSHER_KEY`
   - `PUSHER_SECRET`
   - `PUSHER_CLUSTER`

### 5. Actualizar el cliente

Una vez desplegado, actualiza la URL del backend en `private-chat-client.html`:

```javascript
// Cambia todas las URLs de localhost a tu URL de Vercel
const API_URL = 'https://tu-proyecto.vercel.app';
```

## 📱 Uso del Cliente

1. Abre `private-chat-client.html` en dos navegadores diferentes
2. **Usuario 1:**
   - Completa: Pusher Key, Cluster, Nombre
   - Click "🚀 Crear Canal" → Obtiene código
   - Click "💬 Entrar al Chat"
3. **Usuario 2:**
   - Completa: Pusher Key, Cluster, Nombre
   - Ingresa el código del Usuario 1
   - Click "🔑 Unirse al Canal"
   - Click "💬 Entrar al Chat"
4. **¡Listo!** Ambos pueden intercambiar mensajes en tiempo real

## 📡 API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/pusher/auth` | POST | Autenticación de Pusher |
| `/create-channel` | POST | Crear canal privado con código |
| `/join-channel` | POST | Unirse a canal con código |
| `/channel-info/:code` | GET | Obtener información del canal |
| `/send-message` | POST | Enviar mensaje al canal |
| `/messages/:channelName` | GET | Obtener historial de mensajes |
| `/channel/:channelName` | GET | Obtener info del canal desde Pusher |
| `/health` | GET | Health check del servidor |

## 🔒 Seguridad

- ✅ Códigos únicos de 6 dígitos
- ✅ Validación de acceso en autenticación Pusher
- ✅ Control de miembros por canal
- ✅ Rechazo de códigos inválidos
- ✅ `PUSHER_SECRET` nunca expuesto al cliente

## 🛠️ Estructura del Proyecto

```
chat-channels/
├── index.js                    # Servidor Express con todas las rutas
├── private-chat-client.html    # Cliente web con interfaz moderna
├── package.json               # Dependencias y scripts
├── vercel.json               # Configuración de deployment
├── .vercelignore            # Archivos a ignorar en deploy
├── env.example              # Ejemplo de variables de entorno
└── README.md               # Este archivo
```

## 🔧 Configuración de Pusher

1. Ve a [Pusher Dashboard](https://dashboard.pusher.com/)
2. Crea una nueva aplicación o selecciona una existente
3. Ve a la pestaña "App Keys"
4. Habilita **Client Events** si quieres eventos P2P
5. Copia los valores y úsalos en tu `.env` o Vercel

## 💻 Tecnologías

- **Backend:** Node.js + Express
- **Real-time:** Pusher Channels (Presence)
- **Frontend:** HTML5 + Vanilla JavaScript
- **Deployment:** Vercel (Serverless)

## 📝 Notas

- Los mensajes se almacenan en memoria (se pierden al reiniciar el servidor)
- Para producción, considera usar una base de datos
- Los canales mantienen los últimos 100 mensajes
- Los códigos son únicos y se generan automáticamente

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
