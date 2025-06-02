import { Module } from '@nestjs/common';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [WhatsappModule, WebsocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
