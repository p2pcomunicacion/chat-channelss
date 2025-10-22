const express = require('express');
const cors = require('cors');
const Pusher = require('pusher');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// In-memory message storage (for demo purposes)
const messageHistory = new Map(); // channel -> array of messages

// Channel access codes system
const channelCodes = new Map(); // code -> channel info
const channelAccess = new Map(); // channel -> set of user_ids
const onlineUsers = new Map(); // channel -> Map(user_id -> user_info)

// Utility functions
function generateChannelCode() {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateChannelId() {
  // Generate a unique channel ID for private channel
  return 'private-channel-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function hasChannelAccess(channelName, userId) {
  const accessSet = channelAccess.get(channelName);
  return accessSet && accessSet.has(String(userId));
}

function grantChannelAccess(channelName, userId) {
  if (!channelAccess.has(channelName)) {
    channelAccess.set(channelName, new Set());
  }
  channelAccess.get(channelName).add(String(userId));
}

function addOnlineUser(channelName, userId, userName) {
  if (!onlineUsers.has(channelName)) {
    onlineUsers.set(channelName, new Map());
  }
  onlineUsers.get(channelName).set(String(userId), {
    userId: String(userId),
    userName: userName,
    lastSeen: new Date().toISOString()
  });
}

function removeOnlineUser(channelName, userId) {
  if (onlineUsers.has(channelName)) {
    onlineUsers.get(channelName).delete(String(userId));
  }
}

function getOnlineUsers(channelName) {
  if (!onlineUsers.has(channelName)) {
    return [];
  }
  return Array.from(onlineUsers.get(channelName).values());
}

// Middleware
app.use(cors());
app.use(express.json());

// Validar variables de entorno
if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
  console.error('❌ ERROR: Las variables de entorno de Pusher no están configuradas!');
  console.error('Variables faltantes:');
  if (!process.env.PUSHER_APP_ID) console.error('  - PUSHER_APP_ID');
  if (!process.env.PUSHER_KEY) console.error('  - PUSHER_KEY');
  if (!process.env.PUSHER_SECRET) console.error('  - PUSHER_SECRET');
  if (!process.env.PUSHER_CLUSTER) console.error('  - PUSHER_CLUSTER');
  console.error('\n⚠️  Por favor configura las variables de entorno en el Dashboard de Vercel o archivo .env');
}

// Inicializar Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET, // nunca en el cliente
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Endpoint para crear canal privado
app.post('/create-channel', (req, res) => {
  const { user_id, user_name } = req.body;

  if (!user_id || !user_name) {
    return res.status(400).json({ error: 'Faltan user_id o user_name' });
  }

  try {
    const channelCode = generateChannelCode();
    const channelId = generateChannelId();
    
    // Almacenar información del canal
    channelCodes.set(channelCode, {
      channelId: channelId,
      creatorId: user_id,
      creatorName: user_name,
      createdAt: new Date().toISOString(),
      members: [user_id]
    });

    // Otorgar acceso al creador
    grantChannelAccess(channelId, user_id);

    console.log(`✅ Canal creado: ${channelCode} por usuario ${user_id} (${user_name})`);

    res.json({
      success: true,
      channelCode: channelCode,
      channelId: channelId,
      message: 'Canal creado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al crear canal:', error);
    res.status(500).json({ error: 'Error al crear el canal' });
  }
});

// Endpoint para unirse a canal con código
app.post('/join-channel', (req, res) => {
  const { channelCode, user_id, user_name } = req.body;

  console.log('🔗 Solicitud de unión a canal:', { channelCode, user_id, user_name });

  if (!channelCode || !user_id || !user_name) {
    console.error('❌ Faltan parámetros requeridos para unirse al canal');
    return res.status(400).json({ error: 'Faltan channelCode, user_id o user_name' });
  }

  try {
    const channelInfo = channelCodes.get(channelCode);
    
    if (!channelInfo) {
      console.error(`❌ Código de canal ${channelCode} no encontrado`);
      console.log('Códigos de canal disponibles:', Array.from(channelCodes.keys()));
      return res.status(404).json({ error: 'Código de canal inválido' });
    }

    console.log(`✅ Información del canal encontrada para código ${channelCode}:`, channelInfo);

    // Otorgar acceso al nuevo usuario
    grantChannelAccess(channelInfo.channelId, user_id);
    
    // Agregar a la lista de miembros
    if (!channelInfo.members.includes(user_id)) {
      channelInfo.members.push(user_id);
    }

    console.log(`👤 Usuario ${user_id} (${user_name}) se unió al canal ${channelInfo.channelId}`);

    res.json({
      success: true,
      channelId: channelInfo.channelId,
      creatorName: channelInfo.creatorName,
      members: channelInfo.members,
      message: 'Se unió al canal exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al unirse al canal:', error);
    res.status(500).json({ error: 'Error al unirse al canal' });
  }
});

// Obtener información del canal por código
app.get('/channel-info/:code', (req, res) => {
  const { code } = req.params;

  try {
    const channelInfo = channelCodes.get(code);
    
    if (!channelInfo) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    res.json({
      success: true,
      channelId: channelInfo.channelId,
      creatorName: channelInfo.creatorName,
      memberCount: channelInfo.members.length,
      createdAt: channelInfo.createdAt
    });
  } catch (error) {
    console.error('❌ Error al obtener información del canal:', error);
    res.status(500).json({ error: 'Error al obtener información del canal' });
  }
});

// Endpoint de autenticación de Pusher
app.post('/pusher/auth', (req, res) => {
  const { socket_id, channel_name, user_id, user_name } = req.body || {};

  // Logging de debug
  console.log('📡 Solicitud de autenticación:', { socket_id, channel_name, user_id, user_name });

  try {
    // Verificar si Pusher está configurado
    if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_SECRET) {
      console.error('❌ Pusher no configurado - faltan variables de entorno');
      console.error('Variables de entorno disponibles:', {
        PUSHER_APP_ID: !!process.env.PUSHER_APP_ID,
        PUSHER_KEY: !!process.env.PUSHER_KEY,
        PUSHER_SECRET: !!process.env.PUSHER_SECRET,
        PUSHER_CLUSTER: !!process.env.PUSHER_CLUSTER
      });
      return res.status(500).json({ 
        error: 'Error de configuración del servidor',
        message: 'Credenciales de Pusher no configuradas. Por favor configura las variables de entorno PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET y PUSHER_CLUSTER.'
      });
    }

    // Validar parámetros requeridos
    if (!socket_id || !channel_name) {
      console.error('❌ Faltan parámetros requeridos:', { socket_id, channel_name });
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos',
        message: 'socket_id y channel_name son requeridos'
      });
    }

    // Validar acceso para canales privados
    if (channel_name.startsWith("private-")) {
      // Para canales privados, necesitamos user_id
      if (!user_id) {
        console.error('❌ Falta user_id para autenticación de canal privado');
        return res.status(400).json({ 
          error: 'Falta user_id',
          message: 'user_id es requerido para autenticación de canal privado'
        });
      }

      if (!hasChannelAccess(channel_name, user_id)) {
        console.log(`❌ Acceso denegado para usuario ${user_id} al canal ${channel_name}`);
        return res.status(403).json({ error: 'Acceso denegado a este canal' });
      }
      
      // Agregar usuario a usuarios en línea cuando se autentica
      addOnlineUser(channel_name, user_id, user_name);
      console.log(`👤 Usuario ${user_id} (${user_name}) ahora está en línea en el canal ${channel_name}`);
    }

    // Autenticar para canales privados
    console.log('🔄 Intentando autenticación de Pusher...');
    const auth = pusher.authenticate(socket_id, channel_name);
    console.log('✅ Autenticación exitosa para canal privado');
    return res.status(200).json(auth);
  } catch (error) {
    console.error('❌ Error de autenticación de Pusher:', error);
    console.error('Detalles del error:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Logging de error más detallado
    console.error('Cuerpo de la solicitud:', req.body);
    console.error('Verificación de entorno:', {
      PUSHER_APP_ID: process.env.PUSHER_APP_ID,
      PUSHER_KEY: process.env.PUSHER_KEY,
      PUSHER_SECRET: process.env.PUSHER_SECRET ? '***oculto***' : 'NO_CONFIGURADO',
      PUSHER_CLUSTER: process.env.PUSHER_CLUSTER
    });
    
    return res.status(500).json({ 
      error: 'Error de autenticación',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Endpoint para enviar mensaje
app.post('/send-message', (req, res) => {
  const { channel, event, data, user_id, user_name } = req.body;

  if (!channel || !event || !data) {
    return res.status(400).json({ error: 'Faltan campos requeridos: channel, event, data' });
  }

  try {
    // Verificar acceso al canal para canales privados
    if (channel.startsWith("private-")) {
      if (!hasChannelAccess(channel, user_id)) {
        console.log(`❌ Acceso denegado para usuario ${user_id} para enviar mensaje al canal ${channel}`);
        return res.status(403).json({ error: 'Acceso denegado para enviar mensajes a este canal' });
      }
    }

    const messageData = {
      ...data,
      from: user_id || 'anónimo', // Flutter espera 'from'
      ts: new Date().toISOString(), // Flutter espera 'ts'
      id: Date.now() + Math.random(), // ID único simple
      user_id: user_id || 'anónimo', // Mantener para compatibilidad
      user_name: user_name || 'Anónimo',
      timestamp: new Date().toISOString()
    };

    // Almacenar mensaje en historial
    if (!messageHistory.has(channel)) {
      messageHistory.set(channel, []);
    }
    messageHistory.get(channel).push(messageData);

    // Mantener solo los últimos 100 mensajes por canal
    const channelMessages = messageHistory.get(channel);
    if (channelMessages.length > 100) {
      channelMessages.splice(0, channelMessages.length - 100);
    }

    // Transmitir mensaje a todos los suscriptores del canal
    console.log(`📤 Transmitiendo mensaje al canal ${channel}`);
    console.log(`📤 Evento: ${event}`);
    console.log(`📤 Datos del mensaje:`, JSON.stringify(messageData, null, 2));
    console.log(`📤 ID de Usuario: ${user_id}`);
    console.log(`📤 Nombre de Usuario: ${user_name}`);
    
    // Verificar que el canal existe y tiene suscriptores
    pusher.get({ path: `/channels/${channel}` }, (error, request, response) => {
      if (error) {
        console.error(`❌ Error al obtener información del canal ${channel}:`, error);
      } else {
        console.log(`📊 Información del canal ${channel}:`, JSON.stringify(response.body, null, 2));
        const subscriberCount = response.body?.subscription_count || 0;
        console.log(`👥 Suscriptores en el canal ${channel}: ${subscriberCount}`);
      }
    });
    
    pusher.trigger(channel, event, messageData);
    
    console.log(`📤 Mensaje enviado al canal ${channel} por usuario ${user_id}`);

    res.json({ 
      success: true, 
      message: 'Mensaje enviado exitosamente',
      messageId: messageData.id,
      timestamp: messageData.timestamp
    });
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// Endpoint para obtener historial de mensajes
app.get('/messages/:channelName', (req, res) => {
  const { channelName } = req.params;
  const { limit = 50 } = req.query;
  
  try {
    const messages = messageHistory.get(channelName) || [];
    const limitedMessages = messages.slice(-parseInt(limit));
    
    res.json({
      channel: channelName,
      messages: limitedMessages,
      total: messages.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al obtener historial de mensajes:', error);
    res.status(500).json({ error: 'Error al obtener historial de mensajes' });
  }
});

// Endpoint para obtener información del canal
app.get('/channel/:channelName', (req, res) => {
  const { channelName } = req.params;
  
  try {
    // Obtener información del canal desde Pusher
    pusher.get({ path: `/channels/${channelName}` }, (error, request, response) => {
      if (error) {
        return res.status(500).json({ error: 'Error al obtener información del canal' });
      }
      
      res.json({
        channel: channelName,
        info: response.body,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('❌ Error al obtener información del canal:', error);
    res.status(500).json({ error: 'Error al obtener información del canal' });
  }
});

// Endpoint de webhook de Pusher (OPCIONAL - para notificaciones del servidor)
app.post('/pusher/webhook', (req, res) => {
  const webhook = req.body;
  
  console.log('🪝 Webhook recibido de Pusher:', webhook);
  
  // Verificar autenticidad del webhook
  const crypto = require('crypto');
  const receivedSignature = req.headers['x-pusher-signature'];
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PUSHER_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (receivedSignature !== expectedSignature) {
    console.error('❌ Firma de webhook inválida');
    return res.status(401).json({ error: 'Firma inválida' });
  }
  
  // Procesar eventos
  webhook.events?.forEach(event => {
    switch(event.name) {
      case 'channel_occupied':
        console.log(`📢 Canal ocupado: ${event.channel}`);
        // Aquí podrías: guardar en BD, enviar notificación, etc.
        break;
        
      case 'channel_vacated':
        console.log(`📭 Canal vacío: ${event.channel}`);
        // Aquí podrías: limpiar el canal de memoria, guardar estadísticas
        break;
        
      case 'member_added':
        console.log(`👤 Miembro agregado: ${event.user_id} al canal ${event.channel}`);
        break;
        
      case 'member_removed':
        console.log(`👋 Miembro removido: ${event.user_id} del canal ${event.channel}`);
        break;
        
      default:
        console.log(`ℹ️ Evento desconocido: ${event.name}`);
    }
  });
  
  res.status(200).json({ received: true });
});

// Endpoint para obtener usuarios en línea
app.get('/online-users/:channelName', (req, res) => {
  const { channelName } = req.params;
  
  try {
    const users = getOnlineUsers(channelName);
    res.json({
      success: true,
      channel: channelName,
      onlineUsers: users,
      count: users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al obtener usuarios en línea:', error);
    res.status(500).json({ error: 'Error al obtener usuarios en línea' });
  }
});

// Endpoint de latido del usuario (para mantener usuarios en línea)
app.post('/user-heartbeat', (req, res) => {
  const { channel, user_id, user_name } = req.body;
  
  if (!channel || !user_id) {
    return res.status(400).json({ error: 'Falta canal o user_id' });
  }
  
  try {
    addOnlineUser(channel, user_id, user_name);
    res.json({ success: true, message: 'Latido recibido' });
  } catch (error) {
    console.error('❌ Error al procesar latido:', error);
    res.status(500).json({ error: 'Error al procesar latido' });
  }
});

// Endpoint de desconexión de usuario
app.post('/user-disconnect', (req, res) => {
  const { channel, user_id } = req.body;
  
  if (!channel || !user_id) {
    return res.status(400).json({ error: 'Falta canal o user_id' });
  }
  
  try {
    removeOnlineUser(channel, user_id);
    console.log(`👋 Usuario ${user_id} desconectado del canal ${channel}`);
    res.json({ success: true, message: 'Usuario desconectado' });
  } catch (error) {
    console.error('❌ Error al procesar desconexión:', error);
    res.status(500).json({ error: 'Error al procesar desconexión' });
  }
});

// Endpoint de debug para verificar estado del canal
app.get('/debug/channel/:channelName', (req, res) => {
  const { channelName } = req.params;
  
  try {
    pusher.get({ path: `/channels/${channelName}` }, (error, request, response) => {
      if (error) {
        return res.status(500).json({ 
          error: 'Error al obtener información del canal',
          details: error.message 
        });
      }
      
      const channelInfo = response.body;
      const hasAccess = hasChannelAccess(channelName, req.query.user_id);
      const onlineUsersList = getOnlineUsers(channelName);
      
      res.json({
        channel: channelName,
        channelInfo: channelInfo,
        hasAccess: hasAccess,
        onlineUsers: onlineUsersList,
        messageHistory: messageHistory.get(channelName) || [],
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('❌ Error en endpoint de debug:', error);
    res.status(500).json({ error: 'Error al obtener información de debug' });
  }
});

// Endpoint de verificación de salud
app.get('/health', (req, res) => {
  const envConfigured = !!(
    process.env.PUSHER_APP_ID && 
    process.env.PUSHER_KEY && 
    process.env.PUSHER_SECRET && 
    process.env.PUSHER_CLUSTER
  );
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    pusherConfigured: envConfigured,
    env: process.env.NODE_ENV || 'development',
    ...(envConfigured ? {} : {
      warning: 'Las variables de entorno de Pusher no están configuradas',
      missingVars: [
        !process.env.PUSHER_APP_ID && 'PUSHER_APP_ID',
        !process.env.PUSHER_KEY && 'PUSHER_KEY',
        !process.env.PUSHER_SECRET && 'PUSHER_SECRET',
        !process.env.PUSHER_CLUSTER && 'PUSHER_CLUSTER'
      ].filter(Boolean)
    })
  });
});

// Endpoint de debug para variables de entorno
app.get('/debug/env', (req, res) => {
  res.json({
    PUSHER_APP_ID: process.env.PUSHER_APP_ID || 'NO_CONFIGURADO',
    PUSHER_KEY: process.env.PUSHER_KEY || 'NO_CONFIGURADO',
    PUSHER_SECRET: process.env.PUSHER_SECRET ? '***oculto***' : 'NO_CONFIGURADO',
    PUSHER_CLUSTER: process.env.PUSHER_CLUSTER || 'NO_CONFIGURADO',
    NODE_ENV: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de debug para códigos de canal
app.get('/debug/channels', (req, res) => {
  const channels = Array.from(channelCodes.entries()).map(([code, info]) => ({
    code,
    channelId: info.channelId,
    creatorId: info.creatorId,
    creatorName: info.creatorName,
    memberCount: info.members.length,
    createdAt: info.createdAt
  }));

  res.json({
    success: true,
    totalChannels: channels.length,
    channels: channels,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
  console.log(`🔐 Endpoint de autenticación Pusher: http://localhost:${port}/pusher/auth`);
  console.log(`➕ Endpoint de crear canal: http://localhost:${port}/create-channel`);
  console.log(`🔗 Endpoint de unirse a canal: http://localhost:${port}/join-channel`);
  console.log(`ℹ️ Endpoint de información de canal: http://localhost:${port}/channel-info/:code`);
  console.log(`📤 Endpoint de enviar mensaje: http://localhost:${port}/send-message`);
  console.log(`📜 Endpoint de historial de mensajes: http://localhost:${port}/messages/:channelName`);
  console.log(`📊 Endpoint de información de canal: http://localhost:${port}/channel/:channelName`);
});