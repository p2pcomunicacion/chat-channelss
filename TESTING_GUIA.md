# 🧪 Guía Completa de Testing

## ⚠️ IMPORTANTE: Postman vs Navegador

### ❌ Postman NO puede probar el tiempo real

**Por qué:** 
- Pusher usa **WebSockets** (conexión persistente)
- Postman solo hace **requests HTTP** (una vez y se desconecta)
- El tiempo real requiere mantener la conexión abierta

### ✅ Qué SÍ puedes probar con Postman

Puedes probar los **endpoints REST**:
- ✅ Crear canal
- ✅ Unirse a canal
- ✅ Enviar mensaje (pero no verás el tiempo real)
- ✅ Health check

### ✅ Qué necesitas para probar el tiempo real

**Opciones:**
1. **Dos navegadores diferentes** (Chrome + Edge) ← Recomendado
2. **Navegador normal + modo incógnito**
3. **Computadora + Móvil**
4. **Dos computadoras diferentes**

---

## 📮 Parte 1: Testing con Postman (Endpoints REST)

### Servidor Local

**Base URL:** `http://localhost:3000`

### 1. Health Check

**GET** `http://localhost:3000/health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-18T16:09:06.163Z",
  "pusherConfigured": true,
  "env": "development"
}
```

---

### 2. Crear Canal

**POST** `http://localhost:3000/create-channel`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "user_id": "usuario1",
  "user_name": "Usuario 1"
}
```

**Response:**
```json
{
  "success": true,
  "channelCode": "123456",
  "channelId": "presence-private-1760799063435-jqipu165a",
  "message": "Channel created successfully"
}
```

📝 **Guarda el `channelCode` y `channelId`** - los necesitarás después.

---

### 3. Unirse al Canal

**POST** `http://localhost:3000/join-channel`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "channelCode": "123456",
  "user_id": "usuario2",
  "user_name": "Usuario 2"
}
```

**Response:**
```json
{
  "success": true,
  "channelId": "presence-private-1760799063435-jqipu165a",
  "creatorName": "Usuario 1",
  "members": ["usuario1", "usuario2"],
  "message": "Successfully joined channel"
}
```

---

### 4. Obtener Info del Canal

**GET** `http://localhost:3000/channel-info/123456`

**Response:**
```json
{
  "success": true,
  "channelId": "presence-private-1760799063435-jqipu165a",
  "creatorName": "Usuario 1",
  "memberCount": 2,
  "createdAt": "2025-10-18T15:08:48.095Z"
}
```

---

### 5. Enviar Mensaje

**POST** `http://localhost:3000/send-message`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "channel": "presence-private-1760799063435-jqipu165a",
  "event": "chat-message",
  "data": {
    "text": "Hola desde Postman!",
    "user_id": "usuario1",
    "user_name": "Usuario 1"
  },
  "user_id": "usuario1",
  "user_name": "Usuario 1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": 1760800128095.1836,
  "timestamp": "2025-10-18T16:08:48.095Z"
}
```

⚠️ **NOTA:** El mensaje se envía, pero NO verás el tiempo real en Postman. Para eso necesitas navegadores.

---

### 6. Ver Historial de Mensajes

**GET** `http://localhost:3000/messages/presence-private-1760799063435-jqipu165a`

**Response:**
```json
{
  "channel": "presence-private-1760799063435-jqipu165a",
  "messages": [
    {
      "text": "Hola desde Postman!",
      "user_id": "usuario1",
      "user_name": "Usuario 1",
      "timestamp": "2025-10-18T16:08:48.095Z",
      "id": 1760800128095.1836
    }
  ],
  "total": 1,
  "timestamp": "2025-10-18T16:09:00.000Z"
}
```

---

## 🌐 Parte 2: Testing de Tiempo Real (Navegadores)

### ✅ Método Recomendado: Dos Navegadores

#### Preparación:
1. Abre **Chrome** → Ve a `private-chat-client.html`
2. Abre **Edge** → Ve a `private-chat-client.html`
3. Abre **F12** en ambos → Pestaña **Console**

#### Usuario 1 (Chrome):
```
1. Pusher Key: [tu key]
2. Cluster: [tu cluster, ej: us2]
3. Nombre: Usuario1
4. Click "🚀 Crear Canal"
5. Copia el código de 6 dígitos
6. Click "💬 Entrar al Chat"
```

**En consola verás:**
```javascript
🔌 Pusher conectado exitosamente
📡 Socket ID: 123456.789012
📢 Suscribiéndose al canal: presence-private-...
✅ Suscripción exitosa al canal
👥 Miembros actuales: {Usuario1: {...}}
🔔 Ahora escuchando eventos chat-message...
```

#### Usuario 2 (Edge):
```
1. Pusher Key: [la misma key]
2. Cluster: [el mismo cluster]
3. Nombre: Usuario2
4. Pega el código de 6 dígitos
5. Click "🔑 Unirse al Canal"
6. Click "💬 Entrar al Chat"
```

**En consola de Chrome (Usuario1) verás:**
```javascript
👤 Nuevo miembro: {name: "Usuario2"}
```

**En consola de Edge (Usuario2) verás:**
```javascript
🔌 Pusher conectado exitosamente
✅ Suscripción exitosa al canal
👥 Miembros actuales: {Usuario1: {...}, Usuario2: {...}}
```

#### Probar Tiempo Real:

**En Chrome (Usuario1):**
```
1. Escribe: "Hola Usuario2!"
2. Click "Enviar"
```

**Resultado en Edge (Usuario2) - AUTOMÁTICO:**
```javascript
// En consola:
📨 Mensaje recibido: {text: "Hola Usuario2!", user_id: "Usuario1"}
✅ Mostrando mensaje de otro usuario

// En UI:
[Aparece el mensaje SIN REFRESCAR] ✨
```

**En Edge (Usuario2):**
```
1. Escribe: "Hola! Te veo en tiempo real 🎉"
2. Click "Enviar"
```

**Resultado en Chrome (Usuario1) - AUTOMÁTICO:**
```javascript
📨 Mensaje recibido: {text: "Hola! Te veo en tiempo real 🎉", user_id: "Usuario2"}
✅ Mostrando mensaje de otro usuario
```

---

## 🔬 Parte 3: Testing Híbrido (Postman + Navegador)

### Caso de Uso: Simular un tercer usuario enviando mensajes

#### Paso 1: Crear canal desde navegador
```
1. Abre navegador
2. Crea canal con Usuario1
3. Copia el channelId (ej: presence-private-123...)
4. Conecta al chat
```

#### Paso 2: Enviar mensaje desde Postman

**POST** `http://localhost:3000/send-message`

```json
{
  "channel": "presence-private-123...",
  "event": "chat-message",
  "data": {
    "text": "Mensaje desde Postman!",
    "user_id": "postman_bot",
    "user_name": "Postman Bot"
  },
  "user_id": "postman_bot",
  "user_name": "Postman Bot"
}
```

#### Paso 3: Ver en el navegador

**El navegador mostrará el mensaje AUTOMÁTICAMENTE:**
```
📨 Mensaje recibido desde Postman
✅ "Mensaje desde Postman!"
```

---

## 🎯 Comparación

| Característica | Postman | Navegador |
|----------------|---------|-----------|
| Crear canal | ✅ | ✅ |
| Unirse a canal | ✅ | ✅ |
| Enviar mensaje | ✅ | ✅ |
| **Recibir mensajes en tiempo real** | ❌ | ✅ |
| Ver historial | ✅ | ✅ |
| Mantener conexión WebSocket | ❌ | ✅ |
| Ver presencia (quién está online) | ❌ | ✅ |

---

## 🔍 Debugging

### Ver Logs del Servidor

**Terminal donde corre el servidor:**
```
Server running on port 3000
📡 Auth request: {socket_id: '123.456', channel_name: 'presence-private-...'}
✅ Auth successful for presence channel
📤 Message sent to channel: presence-private-...
```

### Ver Logs de Pusher

**Dashboard de Pusher:**
1. Ve a [pusher.com/channels](https://pusher.com/channels)
2. Selecciona tu app
3. Click en **Debug Console**
4. Verás todos los eventos en tiempo real:
   - `channel_occupied`
   - `member_added`
   - `member_removed`
   - `chat-message` (tus mensajes)

---

## 📋 Colección de Postman

Puedes importar esta colección:

```json
{
  "info": {
    "name": "Chat Channels API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["health"]
        }
      }
    },
    {
      "name": "Create Channel",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"user_id\": \"usuario1\",\n  \"user_name\": \"Usuario 1\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/create-channel",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["create-channel"]
        }
      }
    },
    {
      "name": "Join Channel",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"channelCode\": \"123456\",\n  \"user_id\": \"usuario2\",\n  \"user_name\": \"Usuario 2\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/join-channel",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["join-channel"]
        }
      }
    },
    {
      "name": "Send Message",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"channel\": \"presence-private-123\",\n  \"event\": \"chat-message\",\n  \"data\": {\n    \"text\": \"Hola desde Postman!\",\n    \"user_id\": \"usuario1\",\n    \"user_name\": \"Usuario 1\"\n  },\n  \"user_id\": \"usuario1\",\n  \"user_name\": \"Usuario 1\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/send-message",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["send-message"]
        }
      }
    }
  ]
}
```

Guarda esto como `chat-channels.postman_collection.json` y impórtalo en Postman.

---

## ✅ Checklist de Testing

### Endpoints REST (Postman):
- [ ] Health check responde 200
- [ ] Crear canal funciona
- [ ] Unirse a canal funciona
- [ ] Enviar mensaje funciona (envía pero no ves tiempo real)
- [ ] Ver historial funciona

### Tiempo Real (Navegadores):
- [ ] Usuario1 se conecta
- [ ] Usuario2 se conecta
- [ ] Usuario1 ve que Usuario2 se unió
- [ ] Usuario1 envía mensaje → Usuario2 lo ve INMEDIATAMENTE
- [ ] Usuario2 envía mensaje → Usuario1 lo ve INMEDIATAMENTE
- [ ] Sin refrescar, sin delay
- [ ] Logs en consola muestran todos los eventos

---

## 💡 Tip Pro

**Mejor flujo de trabajo:**

1. **Postman** → Desarrollo y testing de endpoints
2. **Navegadores** → Testing de tiempo real y UI
3. **Debug Console de Pusher** → Ver tráfico de WebSockets

---

## 🆘 Si algo falla

1. **Verifica el servidor:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Verifica logs del servidor** en la terminal

3. **Verifica consola del navegador** (F12)

4. **Verifica Debug Console de Pusher**

---

¡Listo! Ahora puedes probar tanto los endpoints REST (Postman) como el tiempo real (navegadores). 🎉

