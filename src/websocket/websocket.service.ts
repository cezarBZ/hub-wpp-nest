import { Injectable } from '@nestjs/common';
import { WebSocket } from 'ws';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketService {
  constructor(private readonly gateway: WebsocketGateway) {}

  broadcast(data: any) {
    const message = JSON.stringify(data);
    this.gateway.getClients().forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
