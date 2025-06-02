/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { DisconnectReason } from 'baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';

@Injectable()
export class ConnectionHandlerService {
  async handleConnectionUpdate(update: any) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(await QRCode.toString(qr, { type: 'terminal', small: true }));
    }

    if (connection === 'close') {
      if (
        (lastDisconnect?.error as Boom)?.output?.statusCode ===
        DisconnectReason.restartRequired
      ) {
        console.log('⚠️ Socket restart required, reconnecting...');
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
