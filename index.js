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

// Validate environment variables
if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
  console.error('❌ ERROR: Pusher environment variables are not configured!');
  console.error('Missing variables:');
  if (!process.env.PUSHER_APP_ID) console.error('  - PUSHER_APP_ID');
  if (!process.env.PUSHER_KEY) console.error('  - PUSHER_KEY');
  if (!process.env.PUSHER_SECRET) console.error('  - PUSHER_SECRET');
  if (!process.env.PUSHER_CLUSTER) console.error('  - PUSHER_CLUSTER');
  console.error('\n⚠️  Please configure environment variables in Vercel Dashboard or .env file');
}

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET, // nunca en el cliente
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Create private channel endpoint
app.post('/create-channel', (req, res) => {
  const { user_id, user_name } = req.body;

  if (!user_id || !user_name) {
    return res.status(400).json({ error: 'Missing user_id or user_name' });
  }

  try {
    const channelCode = generateChannelCode();
    const channelId = generateChannelId();
    
    // Store channel info
    channelCodes.set(channelCode, {
      channelId: channelId,
      creatorId: user_id,
      creatorName: user_name,
      createdAt: new Date().toISOString(),
      members: [user_id]
    });

    // Grant access to creator
    grantChannelAccess(channelId, user_id);

    res.json({
      success: true,
      channelCode: channelCode,
      channelId: channelId,
      message: 'Channel created successfully'
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Join channel with code endpoint
app.post('/join-channel', (req, res) => {
  const { channelCode, user_id, user_name } = req.body;

  if (!channelCode || !user_id || !user_name) {
    return res.status(400).json({ error: 'Missing channelCode, user_id or user_name' });
  }

  try {
    const channelInfo = channelCodes.get(channelCode);
    
    if (!channelInfo) {
      return res.status(404).json({ error: 'Invalid channel code' });
    }

    // Grant access to new user
    grantChannelAccess(channelInfo.channelId, user_id);
    
    // Add to members list
    if (!channelInfo.members.includes(user_id)) {
      channelInfo.members.push(user_id);
    }

    res.json({
      success: true,
      channelId: channelInfo.channelId,
      creatorName: channelInfo.creatorName,
      members: channelInfo.members,
      message: 'Successfully joined channel'
    });
  } catch (error) {
    console.error('Error joining channel:', error);
    res.status(500).json({ error: 'Failed to join channel' });
  }
});

// Get channel info by code
app.get('/channel-info/:code', (req, res) => {
  const { code } = req.params;

  try {
    const channelInfo = channelCodes.get(code);
    
    if (!channelInfo) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({
      success: true,
      channelId: channelInfo.channelId,
      creatorName: channelInfo.creatorName,
      memberCount: channelInfo.members.length,
      createdAt: channelInfo.createdAt
    });
  } catch (error) {
    console.error('Error getting channel info:', error);
    res.status(500).json({ error: 'Failed to get channel info' });
  }
});

// Pusher authentication endpoint
app.post('/pusher/auth', (req, res) => {
  const { socket_id, channel_name, user_id, user_name } = req.body || {};

  // Debug logging
  console.log('📡 Auth request:', { socket_id, channel_name, user_id, user_name });

  try {
    // Check if Pusher is configured
    if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_SECRET) {
      console.error('❌ Pusher not configured - missing environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Pusher credentials not configured. Please set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, and PUSHER_CLUSTER environment variables.'
      });
    }

    // Validate access for private channels
    if (channel_name.startsWith("private-")) {
      if (!hasChannelAccess(channel_name, user_id)) {
        console.log(`Access denied for user ${user_id} to channel ${channel_name}`);
        return res.status(403).json({ error: 'Access denied to this channel' });
      }
      
      // Add user to online users when they authenticate
      addOnlineUser(channel_name, user_id, user_name);
      console.log(`👤 User ${user_id} (${user_name}) is now online in channel ${channel_name}`);
    }

    // Authenticate for private channels
    const auth = pusher.authenticate(socket_id, channel_name);
    console.log('✅ Auth successful for private channel');
    return res.status(200).json(auth);
  } catch (error) {
    console.error('❌ Pusher authentication error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Send message endpoint
app.post('/send-message', (req, res) => {
  const { channel, event, data, user_id, user_name } = req.body;

  if (!channel || !event || !data) {
    return res.status(400).json({ error: 'Missing required fields: channel, event, data' });
  }

  try {
    // Verificar acceso al canal para canales privados
    if (channel.startsWith("private-")) {
      if (!hasChannelAccess(channel, user_id)) {
        console.log(`❌ Access denied for user ${user_id} to send message to channel ${channel}`);
        return res.status(403).json({ error: 'Access denied to send messages to this channel' });
      }
    }

    const messageData = {
      ...data,
      from: user_id || 'anonymous', // Flutter espera 'from'
      ts: new Date().toISOString(), // Flutter espera 'ts'
      id: Date.now() + Math.random(), // Simple unique ID
      user_id: user_id || 'anonymous', // Mantener para compatibilidad
      user_name: user_name || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    // Store message in history
    if (!messageHistory.has(channel)) {
      messageHistory.set(channel, []);
    }
    messageHistory.get(channel).push(messageData);

    // Keep only last 100 messages per channel
    const channelMessages = messageHistory.get(channel);
    if (channelMessages.length > 100) {
      channelMessages.splice(0, channelMessages.length - 100);
    }

    // Broadcast message to all subscribers of the channel
    console.log(`📤 Broadcasting message to channel ${channel}`);
    console.log(`📤 Event: ${event}`);
    console.log(`📤 Message data:`, JSON.stringify(messageData, null, 2));
    console.log(`📤 User ID: ${user_id}`);
    console.log(`📤 User Name: ${user_name}`);
    
    // Verificar que el canal existe y tiene suscriptores
    pusher.get({ path: `/channels/${channel}` }, (error, request, response) => {
      if (error) {
        console.error(`❌ Error getting channel info for ${channel}:`, error);
      } else {
        console.log(`📊 Channel ${channel} info:`, JSON.stringify(response.body, null, 2));
        const subscriberCount = response.body?.subscription_count || 0;
        console.log(`👥 Subscribers in channel ${channel}: ${subscriberCount}`);
      }
    });
    
    pusher.trigger(channel, event, messageData);
    
    console.log(`📤 Message sent to channel ${channel} by user ${user_id}`);

    res.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: messageData.id,
      timestamp: messageData.timestamp
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get message history endpoint
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
    console.error('Error getting message history:', error);
    res.status(500).json({ error: 'Failed to get message history' });
  }
});

// Get channel info endpoint
app.get('/channel/:channelName', (req, res) => {
  const { channelName } = req.params;
  
  try {
    // Get channel info from Pusher
    pusher.get({ path: `/channels/${channelName}` }, (error, request, response) => {
      if (error) {
        return res.status(500).json({ error: 'Failed to get channel info' });
      }
      
      res.json({
        channel: channelName,
        info: response.body,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('Error getting channel info:', error);
    res.status(500).json({ error: 'Failed to get channel info' });
  }
});

// Pusher webhook endpoint (OPCIONAL - para notificaciones del servidor)
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
    console.error('❌ Webhook signature inválida');
    return res.status(401).json({ error: 'Invalid signature' });
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

// Get online users endpoint
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
    console.error('Error getting online users:', error);
    res.status(500).json({ error: 'Failed to get online users' });
  }
});

// User heartbeat endpoint (to keep users online)
app.post('/user-heartbeat', (req, res) => {
  const { channel, user_id, user_name } = req.body;
  
  if (!channel || !user_id) {
    return res.status(400).json({ error: 'Missing channel or user_id' });
  }
  
  try {
    addOnlineUser(channel, user_id, user_name);
    res.json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
});

// User disconnect endpoint
app.post('/user-disconnect', (req, res) => {
  const { channel, user_id } = req.body;
  
  if (!channel || !user_id) {
    return res.status(400).json({ error: 'Missing channel or user_id' });
  }
  
  try {
    removeOnlineUser(channel, user_id);
    console.log(`👋 User ${user_id} disconnected from channel ${channel}`);
    res.json({ success: true, message: 'User disconnected' });
  } catch (error) {
    console.error('Error processing disconnect:', error);
    res.status(500).json({ error: 'Failed to process disconnect' });
  }
});

// Debug endpoint to check channel status
app.get('/debug/channel/:channelName', (req, res) => {
  const { channelName } = req.params;
  
  try {
    pusher.get({ path: `/channels/${channelName}` }, (error, request, response) => {
      if (error) {
        return res.status(500).json({ 
          error: 'Failed to get channel info',
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
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Failed to get debug info' });
  }
});

// Health check endpoint

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
      warning: 'Pusher environment variables are not configured',
      missingVars: [
        !process.env.PUSHER_APP_ID && 'PUSHER_APP_ID',
        !process.env.PUSHER_KEY && 'PUSHER_KEY',
        !process.env.PUSHER_SECRET && 'PUSHER_SECRET',
        !process.env.PUSHER_CLUSTER && 'PUSHER_CLUSTER'
      ].filter(Boolean)
    })
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Pusher auth endpoint: http://localhost:${port}/pusher/auth`);
  console.log(`Create channel endpoint: http://localhost:${port}/create-channel`);
  console.log(`Join channel endpoint: http://localhost:${port}/join-channel`);
  console.log(`Channel info endpoint: http://localhost:${port}/channel-info/:code`);
  console.log(`Send message endpoint: http://localhost:${port}/send-message`);
  console.log(`Message history endpoint: http://localhost:${port}/messages/:channelName`);
  console.log(`Channel info endpoint: http://localhost:${port}/channel/:channelName`);
});