import { Injectable, OnModuleInit } from '@nestjs/common';
import { WebSocketServer, WebSocket } from 'ws';

@Injectable()
export class WebsocketGateway implements OnModuleInit {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  onModuleInit() {
    this.wss = new WebSocketServer({ port: 3001 });
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
    });
    console.log('📡 WebSocket server running on ws://localhost:3001');
  }

  getClients(): Set<WebSocket> {
    return this.clients;
  }
}
