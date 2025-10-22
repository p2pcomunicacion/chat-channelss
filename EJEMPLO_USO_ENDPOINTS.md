# Ejemplo de Uso de Endpoints - Chat Channels

## Problemas Solucionados

### 1. Error 400 en `/pusher/auth` (al crear canal)
**Problema:** El endpoint requería `user_id` para canales privados pero no lo validaba correctamente.
**Solución:** Agregada validación explícita de `user_id` para canales privados.

### 2. Error 404 en `/join-channel` (al unirse a canal)
**Problema:** El endpoint no estaba correctamente configurado en Vercel.
**Solución:** Actualizado `vercel.json` con todas las rutas necesarias.

## Cómo Usar los Endpoints

### 1. Crear un Canal
```javascript
// POST /create-channel
const response = await fetch('https://chat-channelss.vercel.app/create-channel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 'user123',
    user_name: 'Juan Pérez'
  })
});

const data = await response.json();
console.log('Canal creado:', data);
// Respuesta: { success: true, channelCode: "123456", channelId: "private-channel-...", message: "Canal creado exitosamente" }
```

### 2. Unirse a un Canal
```javascript
// POST /join-channel
const response = await fetch('https://chat-channelss.vercel.app/join-channel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    channelCode: '123456', // Código obtenido al crear el canal
    user_id: 'user456',
    user_name: 'María García'
  })
});

const data = await response.json();
console.log('Unido al canal:', data);
// Respuesta: { success: true, channelId: "private-channel-...", creatorName: "Juan Pérez", members: ["user123", "user456"], message: "Se unió al canal exitosamente" }
```

### 3. Autenticación con Pusher (para canales privados)
```javascript
// POST /pusher/auth
const response = await fetch('https://chat-channelss.vercel.app/pusher/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    socket_id: '123456.789012', // Socket ID de Pusher
    channel_name: 'private-channel-1234567890-abc123', // Channel ID obtenido al crear/unirse
    user_id: 'user123', // IMPORTANTE: Debe coincidir con el usuario que creó/se unió al canal
    user_name: 'Juan Pérez'
  })
});

const authData = await response.json();
console.log('Autenticación exitosa:', authData);
```

## Endpoints de Debug

### Verificar Variables de Entorno
```javascript
// GET /debug/env
const response = await fetch('https://chat-channelss.vercel.app/debug/env');
const envData = await response.json();
console.log('Variables de entorno:', envData);
```

### Ver Canales Disponibles
```javascript
// GET /debug/channels
const response = await fetch('https://chat-channelss.vercel.app/debug/channels');
const channelsData = await response.json();
console.log('Canales disponibles:', channelsData);
```

### Verificar Estado del Servidor
```javascript
// GET /health
const response = await fetch('https://chat-channelss.vercel.app/health');
const healthData = await response.json();
console.log('Estado del servidor:', healthData);
```

## Flujo Completo de Uso

1. **Crear canal:** Usar `/create-channel` para obtener `channelCode` y `channelId`
2. **Unirse al canal:** Usar `/join-channel` con el `channelCode` para obtener acceso
3. **Autenticar con Pusher:** Usar `/pusher/auth` con el `channelId` para conectarse al canal privado
4. **Enviar mensajes:** Usar `/send-message` para enviar mensajes al canal
5. **Recibir mensajes:** Suscribirse a eventos de Pusher para recibir mensajes en tiempo real

## Notas Importantes

- **user_id debe ser consistente:** El mismo `user_id` debe usarse en todos los endpoints para el mismo usuario
- **Los canales son privados:** Todos los canales creados son privados y requieren autenticación
- **Códigos de canal:** Los códigos de 6 dígitos son únicos y permiten que otros usuarios se unan
- **Variables de entorno:** Asegúrate de que las variables de Pusher estén configuradas en Vercel

## Mensajes de Error en Español

Ahora todos los mensajes de error y logs están en español:

- `"Canal creado exitosamente"` - Al crear un canal
- `"Se unió al canal exitosamente"` - Al unirse a un canal
- `"Mensaje enviado exitosamente"` - Al enviar un mensaje
- `"Faltan user_id o user_name"` - Error de parámetros faltantes
- `"Código de canal inválido"` - Error de código de canal
- `"Acceso denegado a este canal"` - Error de permisos
- `"Las variables de entorno de Pusher no están configuradas"` - Error de configuración
