import { WebSocketServer } from 'ws';
import { verifyWsToken } from '../middleware/auth.js';

const clients = new Map();

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    const user = verifyWsToken(token);
    if (!user) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    const clientId = Date.now() + Math.random();
    const clientData = {
      ws,
      user,
      subscriptions: { devices: [], sensorTypes: [] }
    };

    clients.set(clientId, clientData);

    ws.send(JSON.stringify({
      type: 'welcome',
      serverTime: new Date().toISOString(),
      clientId
    }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        
        if (msg.type === 'subscribe') {
          clientData.subscriptions = {
            devices: msg.devices || [],
            sensorTypes: msg.sensorTypes || []
          };
          ws.send(JSON.stringify({
            type: 'subscribed',
            subscriptions: clientData.subscriptions
          }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      clients.delete(clientId);
    });
  });

  return wss;
}

export function broadcast(message) {
  const msg = JSON.stringify(message);
  
  clients.forEach((client) => {
    if (client.ws.readyState === 1) { // OPEN
      const { devices, sensorTypes } = client.subscriptions;
      
      // Check subscription filters
      if (message.deviceId) {
        if (devices.length > 0 && !devices.includes(message.deviceId)) {
          return;
        }
        if (message.sensorType && sensorTypes.length > 0 && 
            !sensorTypes.includes(message.sensorType)) {
          return;
        }
      }

      client.ws.send(msg);
    }
  });
}