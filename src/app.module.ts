import { Module } from '@nestjs/common';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websocket/websocket.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    WhatsappModule,
    WebsocketModule,
    MongooseModule.forRoot('mongodb://localhost:27017/whatsappbot'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
