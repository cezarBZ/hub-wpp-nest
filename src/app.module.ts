import { Module } from '@nestjs/common';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websocket/websocket.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';

@Module({
  imports: [
    WhatsappModule,
    WebsocketModule,
    MongooseModule.forRoot('mongodb://localhost:27017/whatsappbot'),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '', 10) || 6379,
        ttl: 60 * 60, // 1 hora
      }),
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
