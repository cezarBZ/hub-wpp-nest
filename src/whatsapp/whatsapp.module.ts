// src/whatsapp/whatsapp.module.ts
import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ConnectionHandlerService } from './handlers/connection.handler';
import { MessageHandlerService } from './handlers/message.handler';
import { SessionHandlerService } from './handlers/session.handler';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { MessagesModule } from 'src/messages/message.module';
import { LLMHandlerService } from './handlers/llm.handler';
import { WhatsappController } from './whatsapp.controller';
import { QRStorageService } from './qr-storage.service';

@Module({
  imports: [WebsocketModule, MessagesModule],
  providers: [
    WhatsappService,
    ConnectionHandlerService,
    MessageHandlerService,
    SessionHandlerService,
    LLMHandlerService,
    QRStorageService,
  ],
  exports: [WhatsappService],
  controllers: [WhatsappController],
})
export class WhatsappModule {}
