// src/whatsapp/whatsapp.module.ts
import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ConnectionHandlerService } from './handlers/connection.handler';
import { MessageHandlerService } from './handlers/message.handler';
import { SessionHandlerService } from './handlers/session.handler';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  providers: [
    WhatsappService,
    ConnectionHandlerService,
    MessageHandlerService,
    SessionHandlerService,
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}
