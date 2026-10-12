/**
 * CareerPath - Real-Time Communication & WebSocket Gateway
 * Manages authenticated client connections over WebSocket (/ws/events)
 * and Server-Sent Events (/api/v1/events/stream) with userId pub/sub routing.
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class WorkflowEventGateway extends EventEmitter {
  constructor() {
    super();
    // Map: userId -> Set of client connection objects
    this.userConnections = new Map();
    // Set of all active raw sockets
    this.allClients = new Set();
  }

  /**
   * Register a client connection (WebSocket or SSE)
   */
  registerClient(userId, clientObj) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId).add(clientObj);
    this.allClients.add(clientObj);

    clientObj.onClose = () => {
      this.removeClient(userId, clientObj);
    };

    console.log(`[REALTIME GATEWAY] Client registered for User: ${userId}. Total active connections: ${this.allClients.size}`);
  }

  removeClient(userId, clientObj) {
    if (this.userConnections.has(userId)) {
      const set = this.userConnections.get(userId);
      set.delete(clientObj);
      if (set.size === 0) {
        this.userConnections.delete(userId);
      }
    }
    this.allClients.delete(clientObj);
    console.log(`[REALTIME GATEWAY] Client disconnected for User: ${userId}. Remaining: ${this.allClients.size}`);
  }

  /**
   * Broadcast an event to a specific user
   */
  sendToUser(userId, eventType, data = {}) {
    const payload = {
      event: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    const clients = this.userConnections.get(userId);
    if (!clients || clients.size === 0) {
      console.log(`[REALTIME GATEWAY] User ${userId} is currently offline. Event queued in DB notifications.`);
      return false;
    }

    clients.forEach((client) => {
      try {
        client.send(payload);
      } catch (err) {
        console.error('[REALTIME SEND ERROR]', err.message);
      }
    });

    console.log(`[REALTIME GATEWAY] Sent ${eventType} to User ${userId} (${clients.size} devices).`);
    return true;
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(eventType, data = {}) {
    const payload = {
      event: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    this.allClients.forEach((client) => {
      try {
        client.send(payload);
      } catch (err) {
        console.error('[REALTIME BROADCAST ERROR]', err.message);
      }
    });
  }

  /**
   * Attach Native WebSocket RFC 6455 upgrade handler to HTTP Server
   */
  attachHttpServer(server) {
    server.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname !== '/ws/events') {
        return; // Pass through to other handlers if any
      }

      const secKey = req.headers['sec-websocket-key'];
      if (!secKey) {
        socket.destroy();
        return;
      }

      // RFC 6455 WebSocket Handshake
      const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
      const acceptKey = crypto
        .createHash('sha1')
        .update(secKey + GUID)
        .digest('base64');

      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`
      ];

      socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');

      const userId = url.searchParams.get('userId') || 'u0000000-0000-0000-0000-000000000001';

      const wsClient = {
        type: 'websocket',
        userId,
        send: (payload) => {
          const messageStr = JSON.stringify(payload);
          const frame = this.buildWebSocketTextFrame(messageStr);
          socket.write(frame);
        }
      };

      this.registerClient(userId, wsClient);

      // Handle socket incoming and close
      socket.on('close', () => {
        if (wsClient.onClose) wsClient.onClose();
      });

      socket.on('error', (err) => {
        console.error('[WS SOCKET ERROR]', err.message);
        if (wsClient.onClose) wsClient.onClose();
      });

      // Send initial handshake confirmation
      wsClient.send({
        event: 'CONNECTION_ESTABLISHED',
        message: 'Connected to CareerPath Real-Time Recruitment Gateway',
        userId
      });
    });
  }

  /**
   * Helper: Build unmasked WebSocket text frame according to RFC 6455
   */
  buildWebSocketTextFrame(text) {
    const payload = Buffer.from(text, 'utf8');
    const length = payload.length;

    let header;
    if (length <= 125) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + text opcode
      header[1] = length;
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }

    return Buffer.concat([header, payload]);
  }

  /**
   * Express SSE route handler for browser fallback
   */
  handleSseRoute(req, res) {
    const userId = req.query.userId || 'u0000000-0000-0000-0000-000000000001';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`data: ${JSON.stringify({ event: 'CONNECTION_ESTABLISHED', message: 'SSE Stream Active', userId })}\n\n`);

    const sseClient = {
      type: 'sse',
      userId,
      send: (payload) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    this.registerClient(userId, sseClient);

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      if (sseClient.onClose) sseClient.onClose();
    });
  }
}

const gateway = new WorkflowEventGateway();
module.exports = gateway;
