/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DisconnectReason } from 'baileys';
import { Boom } from '@hapi/boom';
import * as QRCode from 'qrcode';
import { WhatsappService } from '../whatsapp.service';

@Injectable()
export class ConnectionHandlerService {
  constructor(
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
  ) {}
  async handleConnectionUpdate(update: any) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(
        await QRCode.toString(qr, {
          type: 'terminal',
          small: true,
        }),
      );
    }

    if (connection === 'close') {
      if (
        (lastDisconnect?.error as Boom)?.output?.statusCode ===
        DisconnectReason.restartRequired
      ) {
        console.log('⚠️ Socket restart required, reconnecting...');
        await this.whatsappService.reconnect();
      }

      if (
        (lastDisconnect?.error as Boom)?.output?.statusCode ===
        DisconnectReason.loggedOut
      ) {
        console.log(
          '🚪 Desconectado permanentemente. Reautenticação necessária.',
        );
      }
    }

    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp');
    }
  }
}
