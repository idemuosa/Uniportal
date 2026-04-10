import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  console.log('Client connected to WebSocket Node Node.');

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    // Broadcast to all clients
    wss.clients.forEach(function each(client) {
      if (client.readyState === 1) {
        client.send(data);
      }
    });
  });

  ws.send(JSON.stringify({ type: 'STATUS', message: 'CONNECTION_ESTABLISHED', node: 'NODE_JS_WS' }));
});

console.log('WebSocket Server running on ws://localhost:8080');
