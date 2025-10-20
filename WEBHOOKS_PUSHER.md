# 🪝 Configurar Webhooks en Pusher (OPCIONAL)

## ⚠️ IMPORTANTE

**¿Necesitas esto?** Probablemente **NO**.

Los webhooks son **OPCIONALES** y NO son necesarios para que el chat funcione en tiempo real.

### ❌ Sin Webhooks (Funciona perfectamente):
```
Usuario envía mensaje → Tu servidor → Pusher → Broadcast → ✅ Tiempo real
```

### ✅ Con Webhooks (Features adicionales):
```
Usuario se conecta → Pusher → Webhook → Tu servidor → Guardar en BD
Usuario se desconecta → Pusher → Webhook → Tu servidor → Enviar notificación
```

---

## 🎯 Casos de Uso

Solo configura webhooks si necesitas:

1. **Guardar eventos en base de datos**
   - Quién se conectó y cuándo
   - Cuánto tiempo estuvo conectado
   - Analytics de uso

2. **Notificaciones offline**
   - Email cuando alguien te envía mensaje y estás offline
   - Push notifications a móviles

3. **Limpieza automática**
   - Eliminar canales vacíos
   - Limpiar memoria cuando nadie está conectado

4. **Triggers externos**
   - Enviar a otros servicios (Slack, Discord, etc.)
   - Integración con CRM

---

## 📝 Configuración en Dashboard de Pusher

### Paso 1: Ve a la sección Webhooks

1. Ve a [pusher.com/channels](https://pusher.com/channels)
2. Selecciona tu app: **groovy-socks-153**
3. Click en **Webhooks** (menú lateral)

### Paso 2: Click en "Add webhook"

### Paso 3: Configurar el Webhook

#### URL del Webhook

**Para desarrollo local (necesitas ngrok):**
```
http://tu-ngrok-url.ngrok.io/pusher/webhook
```

**Para producción (Vercel):**
```
https://chat-channels-liart.vercel.app/pusher/webhook
```

#### Eventos a escuchar:

Marca los que necesites:

- ✅ **channel_occupied** - Cuando el primer usuario se conecta al canal
- ✅ **channel_vacated** - Cuando el último usuario sale del canal
- ✅ **member_added** - Cuando alguien se une (canales de presencia)
- ✅ **member_removed** - Cuando alguien sale (canales de presencia)
- ⬜ **client_event** - Solo si usas client events (no aplicable aquí)

#### Filtrar por canal (opcional):

**Dejar en blanco** para recibir eventos de todos los canales.

O especificar un patrón:
```
presence-private-*
```

### Paso 4: Click "Create"

---

## 🔧 Configuración Local (Desarrollo)

### Problema: Pusher no puede alcanzar localhost

Pusher necesita una URL pública para enviar webhooks.

### Solución: Usar ngrok

#### 1. Instalar ngrok

```bash
# Windows (con Chocolatey)
choco install ngrok

# O descarga desde https://ngrok.com/download
```

#### 2. Crear cuenta en ngrok

Ve a [ngrok.com](https://ngrok.com) y regístrate (gratis).

#### 3. Autenticar ngrok

```bash
ngrok config add-authtoken TU_TOKEN_AQUI
```

#### 4. Iniciar el túnel

```bash
# En una terminal aparte
ngrok http 3000
```

Verás algo como:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

#### 5. Configurar en Pusher

Usa la URL de ngrok:
```
https://abc123.ngrok.io/pusher/webhook
```

---

## 🧪 Probar el Webhook

### Método 1: Desde el Dashboard de Pusher

1. En la página de Webhooks
2. Click en el webhook que creaste
3. Click en **"Test"**
4. Selecciona un evento (ej: `channel_occupied`)
5. Click **"Send test"**

**En tu terminal verás:**
```
🪝 Webhook recibido de Pusher: {
  time_ms: 1760800000000,
  events: [{
    name: 'channel_occupied',
    channel: 'test-channel'
  }]
}
📢 Canal ocupado: test-channel
```

### Método 2: Conectarse al chat

1. Abre dos navegadores
2. Ambos entren al mismo canal
3. **En tu terminal verás:**

```
🪝 Webhook recibido de Pusher
📢 Canal ocupado: presence-private-123...
👤 Miembro agregado: Usuario1 al canal presence-private-123...
👤 Miembro agregado: Usuario2 al canal presence-private-123...
```

---

## 🔒 Seguridad

El código ya incluye verificación de firma:

```javascript
// Verifica que el webhook venga de Pusher
const receivedSignature = req.headers['x-pusher-signature'];
const expectedSignature = crypto
  .createHmac('sha256', process.env.PUSHER_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (receivedSignature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

**⚠️ IMPORTANTE:** Nunca remuevas esta validación en producción.

---

## 📊 Ejemplo: Guardar eventos en memoria

```javascript
// En index.js, modifica el webhook handler:

// Al inicio del archivo
const connectionLog = new Map(); // channel -> array de eventos

// En el webhook handler
case 'member_added':
  console.log(`👤 Miembro agregado: ${event.user_id}`);
  
  // Guardar evento
  if (!connectionLog.has(event.channel)) {
    connectionLog.set(event.channel, []);
  }
  connectionLog.get(event.channel).push({
    type: 'member_added',
    user_id: event.user_id,
    timestamp: new Date().toISOString()
  });
  break;

// Nuevo endpoint para ver el log
app.get('/connection-log/:channel', (req, res) => {
  const { channel } = req.params;
  const log = connectionLog.get(channel) || [];
  res.json({ channel, events: log });
});
```

---

## 📊 Ejemplo: Notificación por email

```javascript
case 'member_added':
  console.log(`👤 Miembro agregado: ${event.user_id}`);
  
  // Enviar email (ejemplo con nodemailer)
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport(/* config */);
  
  await transporter.sendMail({
    from: 'noreply@tu-app.com',
    to: 'admin@tu-app.com',
    subject: `Nuevo usuario conectado`,
    text: `${event.user_id} se conectó al canal ${event.channel}`
  });
  break;
```

---

## 🔍 Debug

### Ver logs del webhook

**Tu terminal mostrará:**
```
🪝 Webhook recibido de Pusher: {...}
📢 Canal ocupado: presence-private-123
👤 Miembro agregado: Usuario1
```

### Dashboard de Pusher

1. Ve a **Debug Console**
2. Verás todos los eventos en tiempo real
3. Cada evento que genera un webhook estará marcado

### Verificar que Pusher puede alcanzar tu servidor

**Dashboard de Pusher → Webhooks → tu webhook → View logs**

Verás:
- ✅ 200 OK - Funciona
- ❌ 500 Error - Revisa tu código
- ❌ Timeout - No puede alcanzar tu servidor

---

## 🚀 Deploy en Vercel

### Paso 1: Actualizar vercel.json

El endpoint ya está incluido en las rutas:

```json
{
  "routes": [
    {
      "src": "/pusher/webhook",
      "dest": "index.js",
      "methods": ["POST"]
    }
  ]
}
```

### Paso 2: Deploy

```bash
git add .
git commit -m "Add webhook support"
git push origin main
```

O:
```bash
vercel --prod
```

### Paso 3: Configurar en Pusher

URL del webhook:
```
https://chat-channels-liart.vercel.app/pusher/webhook
```

---

## ⚡ Resumen

### Lo que YA funciona SIN webhooks:
- ✅ Mensajes en tiempo real
- ✅ Presencia (ver quién está online)
- ✅ Notificaciones de conexión/desconexión (en el cliente)
- ✅ Todo el chat funcional

### Lo que AGREGAS con webhooks:
- ✅ Notificar a TU servidor cuando pasan cosas
- ✅ Guardar eventos en base de datos
- ✅ Enviar notificaciones externas
- ✅ Analytics y estadísticas
- ✅ Triggers automáticos

---

## 💡 Recomendación

**Para empezar:** 
- ❌ NO configures webhooks
- ✅ Enfócate en que el chat funcione

**Más adelante:**
- ✅ Agrega webhooks cuando necesites features específicas
- ✅ Empieza con solo `channel_occupied` y `channel_vacated`
- ✅ Agrega más según necesites

---

## 🆘 Troubleshooting

### Webhook no llega a mi servidor

**Causa 1:** Firewall bloqueando
- Solución: Usa ngrok para desarrollo

**Causa 2:** URL incorrecta
- Solución: Verifica que la URL sea accesible públicamente

**Causa 3:** Servidor no responde 200
- Solución: Revisa logs de tu servidor

### Error "Invalid signature"

**Causa:** El `PUSHER_SECRET` no coincide
- Solución: Verifica que sea el correcto en `.env`

### No veo logs en mi servidor

**Causa:** El webhook no está configurado correctamente
- Solución: Verifica en Pusher Dashboard → Webhooks → View logs

---

## ✅ Checklist

- [ ] Entiendo que los webhooks son OPCIONALES
- [ ] Tengo un caso de uso específico para webhooks
- [ ] Código del webhook agregado a `index.js`
- [ ] ngrok instalado (para desarrollo local)
- [ ] URL pública del servidor
- [ ] Webhook configurado en Pusher Dashboard
- [ ] Eventos seleccionados
- [ ] Test del webhook exitoso
- [ ] Logs visibles en mi terminal

---

¡Eso es todo! Si tienes dudas, pregunta. 🚀

