/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DisconnectReason } from 'baileys';
import { Boom } from '@hapi/boom';
import * as QRCode from 'qrcode';
import { WhatsappService } from '../whatsapp.service';
import { QRStorageService } from '../qr-storage.service'; // ajuste o path conforme sua estrutura

@Injectable()
export class ConnectionHandlerService {
  constructor(
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private readonly qrStorageService: QRStorageService,
  ) {}

  async handleConnectionUpdate(update: any, clientId: string) {
    const { connection, lastDisconnect, qr } = update;
    const reasonCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

    if (qr) {
      this.qrStorageService.setQR(clientId, qr);
      console.log(
        await QRCode.toString(qr, {
          type: 'terminal',
          small: true,
        }),
      );
    }

    if (connection === 'close') {
      if (reasonCode === DisconnectReason.restartRequired) {
        console.log('⚠️ Socket restart required, reconnecting...');
        await this.whatsappService.forceRestartSession(clientId);
      }

      if (
        reasonCode === DisconnectReason.loggedOut ||
        reasonCode === DisconnectReason.connectionLost
      ) {
        console.log(
          `❌ Erro crítico (${reasonCode}). Limpando sessão ${clientId}.`,
        );
        await this.whatsappService.logoutAndDelete(clientId);
      }
    }

    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp');
      this.qrStorageService.clearQR(clientId); // Limpa QR após conexão aberta
    }
  }
}
