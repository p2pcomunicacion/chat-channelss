# 🔧 Configurar Variables de Entorno en Vercel

## ❌ Error Actual:
```
POST https://chat-channels-liart.vercel.app/pusher/auth 500 (Internal Server Error)
```

**Causa:** Las variables de entorno de Pusher NO están configuradas en Vercel.

---

## ✅ Solución: Configurar Variables de Entorno

### Método 1: Desde el Dashboard de Vercel (Recomendado)

#### Paso 1: Ve a tu proyecto en Vercel

1. Abre [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click en tu proyecto: **chat-channels-liart**

#### Paso 2: Configurar Environment Variables

1. Click en **Settings** (pestaña superior)
2. En el menú lateral, click en **Environment Variables**
3. Agrega cada variable:

| Variable Name | Value (ejemplo) | Environment |
|---------------|----------------|-------------|
| `PUSHER_APP_ID` | `1234567` | Production, Preview, Development |
| `PUSHER_KEY` | `a1b2c3d4e5f6g7h8i9j0` | Production, Preview, Development |
| `PUSHER_SECRET` | `k1l2m3n4o5p6q7r8s9t0` | Production, Preview, Development |
| `PUSHER_CLUSTER` | `us2` | Production, Preview, Development |

**⚠️ IMPORTANTE:** Marca las 3 checkboxes (Production, Preview, Development) para cada variable.

#### Paso 3: Obtener tus credenciales de Pusher

Si no tienes las credenciales:

1. Ve a [pusher.com/channels](https://pusher.com/channels)
2. Login o crea una cuenta gratis
3. Create a new app o selecciona una existente
4. Ve a **App Keys**
5. Copia los valores:
   - `app_id` → `PUSHER_APP_ID`
   - `key` → `PUSHER_KEY`
   - `secret` → `PUSHER_SECRET`
   - `cluster` → `PUSHER_CLUSTER`

#### Paso 4: Re-deploy

Después de agregar las variables:

**Opción A: Desde el Dashboard**
1. Ve a **Deployments** (pestaña superior)
2. Click en el deployment más reciente
3. Click en el botón **⋯** (tres puntos)
4. Click **Redeploy**
5. Click **Redeploy** nuevamente para confirmar

**Opción B: Desde tu computadora**
```bash
vercel --prod
```

---

### Método 2: Usando Vercel CLI

```bash
# 1. Login (si no lo has hecho)
vercel login

# 2. Link al proyecto
vercel link

# 3. Agregar variables
vercel env add PUSHER_APP_ID
# Pega el valor cuando te lo pida
# Selecciona: Production, Preview, Development (con espacio)

vercel env add PUSHER_KEY
# Pega el valor

vercel env add PUSHER_SECRET
# Pega el valor

vercel env add PUSHER_CLUSTER
# Pega el valor (ej: us2)

# 4. Re-deploy
vercel --prod
```

---

## 🧪 Verificar que Funcionó

### 1. Health Check

Abre en tu navegador:
```
https://chat-channels-liart.vercel.app/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2025-10-18T..."
}
```

### 2. Ver los Logs

**Opción A: Dashboard**
1. Ve a tu proyecto en Vercel
2. Click en **Deployments**
3. Click en el deployment más reciente
4. Click en **View Function Logs** o **Logs**

**Opción B: CLI**
```bash
vercel logs
```

**Lo que deberías ver:**
```
✅ Pusher configured successfully
Server running on port 3000
```

**Lo que NO deberías ver:**
```
❌ ERROR: Pusher environment variables are not configured!
```

### 3. Probar la Autenticación

Intenta abrir el cliente web y conectarte. En la consola del navegador (F12) deberías ver:

**Antes (Error):**
```
❌ POST https://chat-channels-liart.vercel.app/pusher/auth 500
```

**Después (Funcionando):**
```
✅ POST https://chat-channels-liart.vercel.app/pusher/auth 200
🔌 Pusher conectado exitosamente
```

---

## 🔍 Troubleshooting

### Problema: Sigue dando error 500

**Solución 1: Verifica que agregaste TODAS las variables**
```bash
vercel env ls
```

Deberías ver las 4 variables:
- PUSHER_APP_ID
- PUSHER_KEY
- PUSHER_SECRET
- PUSHER_CLUSTER

**Solución 2: Verifica los valores**

Las variables deben tener valores válidos de Pusher, no placeholders como "tu_key_aqui".

**Solución 3: Re-deploy completo**
```bash
vercel --prod --force
```

### Problema: Variables configuradas pero sigue sin funcionar

**Causa:** El deployment anterior está cacheado.

**Solución:**
1. Dashboard → Deployments → Deployment más reciente → **⋯** → **Redeploy**
2. O desde CLI: `vercel --prod --force`

### Problema: Error "Authentication failed"

**Causa:** Las credenciales de Pusher son incorrectas.

**Solución:**
1. Ve a [pusher.com/channels](https://pusher.com/channels)
2. Verifica que las credenciales sean correctas
3. Actualiza las variables en Vercel
4. Re-deploy

---

## 📋 Checklist de Configuración

- [ ] Cuenta en Pusher creada
- [ ] App en Pusher creada
- [ ] Credenciales copiadas de Pusher Dashboard
- [ ] Variables agregadas en Vercel Dashboard
- [ ] Las 4 variables están configuradas
- [ ] Cada variable tiene las 3 checkboxes marcadas
- [ ] Re-deployed el proyecto
- [ ] Health check responde 200 OK
- [ ] Auth endpoint responde 200 (no 500)
- [ ] Cliente web se conecta exitosamente

---

## 🎯 Valores de Ejemplo

```bash
# NO uses estos valores, son solo ejemplos
PUSHER_APP_ID=1234567
PUSHER_KEY=a1b2c3d4e5f6g7h8i9j0
PUSHER_SECRET=k1l2m3n4o5p6q7r8s9t0
PUSHER_CLUSTER=us2
```

**⚠️ IMPORTANTE:** Usa tus propias credenciales de tu cuenta de Pusher.

---

## 💡 Tips

1. **Pusher Free Plan** es suficiente para desarrollo (100 conexiones, 200k mensajes/día)
2. **No compartas tu PUSHER_SECRET** - nunca lo expongas en el cliente
3. **Re-deploy después de cambiar variables** - los cambios no son automáticos
4. **Verifica los logs** - te dirán exactamente qué falta

---

## 🆘 Ayuda

Si sigues teniendo problemas:

1. **Revisa los logs de Vercel:**
   ```bash
   vercel logs --follow
   ```

2. **Contacta soporte:**
   - Vercel: [vercel.com/support](https://vercel.com/support)
   - Pusher: [support.pusher.com](https://support.pusher.com)

3. **Verifica el código de error en el navegador:**
   - F12 → Console
   - F12 → Network → Click en el request fallido → Response

---

## ✅ Resultado Esperado

Después de configurar las variables correctamente:

```
Usuario abre el cliente web
    ↓
Click "Entrar al Chat"
    ↓
POST /pusher/auth → 200 OK ✅
    ↓
🔌 Pusher conectado exitosamente
    ↓
✅ Conectado al canal privado
    ↓
💬 Mensajes funcionan en tiempo real
```

¡Listo! 🎉

