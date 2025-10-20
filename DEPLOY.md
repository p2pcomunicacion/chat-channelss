# 🚀 Guía de Deployment en Vercel

## ✅ Pre-requisitos

- [x] Cuenta en [Vercel](https://vercel.com) (gratis)
- [x] Credenciales de [Pusher](https://pusher.com) configuradas
- [x] Node.js instalado localmente

---

## 📝 Pasos para Deployar

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login en Vercel

```bash
vercel login
```

### 3. Deploy en Preview (Prueba)

```bash
vercel
```

Esto creará un deployment de prueba y te dará una URL temporal.

### 4. Configurar Variables de Entorno

Ve al dashboard de Vercel o usa el CLI:

```bash
vercel env add PUSHER_APP_ID
vercel env add PUSHER_KEY
vercel env add PUSHER_SECRET
vercel env add PUSHER_CLUSTER
```

O desde el Dashboard:
1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Settings → Environment Variables
3. Agrega cada variable:

| Variable | Ejemplo |
|----------|---------|
| `PUSHER_APP_ID` | `1234567` |
| `PUSHER_KEY` | `a1b2c3d4e5f6g7h8i9j0` |
| `PUSHER_SECRET` | `k1l2m3n4o5p6q7r8s9t0` |
| `PUSHER_CLUSTER` | `us2` |

### 5. Deploy a Producción

```bash
vercel --prod
```

### 6. Actualizar la URL del Cliente

Después del deployment, obtendrás una URL como:
```
https://tu-proyecto.vercel.app
```

Actualiza `private-chat-client.html` línea ~416:

```javascript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://tu-proyecto-real.vercel.app'; // ⚠️ Cambia esto
```

### 7. Re-deploy con la Nueva URL

```bash
vercel --prod
```

---

## 🧪 Probar el Deployment

### Opción 1: Servir el Cliente Estáticamente

Abre `private-chat-client.html` directamente en el navegador:
- Windows: `file:///C:/ruta/al/private-chat-client.html`
- Mac/Linux: `file:///ruta/al/private-chat-client.html`

### Opción 2: Usar un Servidor Local

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (npx)
npx serve .

# Con PHP
php -S localhost:8000
```

Luego abre: `http://localhost:8000/private-chat-client.html`

---

## 🔍 Verificar el Deployment

### Health Check

Visita tu URL de Vercel + `/health`:
```
https://tu-proyecto.vercel.app/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2025-10-18T..."
}
```

### Ver Logs

```bash
vercel logs
```

O desde el Dashboard: Tu Proyecto → Deployments → Click en uno → Logs

---

## ⚠️ Troubleshooting

### Error: "Authentication failed"

**Causa:** Variables de entorno no configuradas
**Solución:** 
```bash
vercel env pull  # Descarga las variables
vercel env ls     # Lista las variables configuradas
```

### Error: "CORS"

**Causa:** El cliente no está permitido por CORS
**Solución:** El servidor ya tiene CORS habilitado con `cors()` en `index.js`

### Mensajes no aparecen en tiempo real

**Causa:** 
- URL incorrecta en el cliente
- Canal no es `presence-`

**Solución:**
1. Verifica que la URL en `private-chat-client.html` sea correcta
2. Verifica en la consola del navegador (F12) si hay errores de Pusher

### Deployment falla

**Causa:** Error de sintaxis o dependencias faltantes
**Solución:**
```bash
npm install        # Reinstalar dependencias
npm test          # Si tienes tests
vercel --debug    # Deploy con debug
```

---

## 📊 Monitoreo

### Ver Analytics

Dashboard de Vercel → Tu Proyecto → Analytics

### Ver Pusher Debug

Dashboard de Pusher → Tu App → Debug Console

---

## 💡 Consejos Pro

### 1. Usar Dominios Custom

Vercel te permite usar tu propio dominio gratis:
1. Dashboard → Settings → Domains
2. Agrega tu dominio
3. Configura los DNS según las instrucciones

### 2. Configurar Alias

```bash
vercel alias set tu-proyecto-xyz.vercel.app mi-chat.com
```

### 3. Proteger con Password

En `vercel.json` agrega:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex"
        }
      ]
    }
  ]
}
```

### 4. Environment Variables por Entorno

- Development: `.env.development`
- Production: `.env.production`
- Preview: `.env.preview`

---

## 🔄 Actualizar el Deployment

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción de los cambios"
git push origin main

# O directamente con Vercel
vercel --prod
```

Si vinculaste tu repo de GitHub/GitLab/Bitbucket, los cambios se deployarán automáticamente.

---

## 🆘 Soporte

- **Vercel Docs:** https://vercel.com/docs
- **Pusher Docs:** https://pusher.com/docs
- **Issues del Proyecto:** [GitHub Issues]

---

## ✅ Checklist de Deployment

- [ ] Variables de entorno configuradas en Vercel
- [ ] URL actualizada en `private-chat-client.html`
- [ ] Health check funcionando
- [ ] Pusher conectándose correctamente
- [ ] Mensajes enviándose en tiempo real
- [ ] Cliente web accesible
- [ ] Códigos de canal funcionando
- [ ] Logs sin errores

¡Listo! 🎉 Tu chat privado está en línea.

