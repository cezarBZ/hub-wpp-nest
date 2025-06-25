import { Controller, Body, Get, Param } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { QRStorageService } from './qr-storage.service';
import * as QRCode from 'qrcode';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly qrStorageService: QRStorageService,
  ) {}

  @Get('qr/:clientId')
  async getQR(@Param('clientId') clientId: string) {
    const session = this.whatsappService.getSession(clientId);

    if (session && session.ws.isOpen && session.user) {
      const user = session.user;
      return {
        status: 'already_connected',
        message: 'Cliente já conectado.',
        user: {
          id: user.id,
          name: user.name,
        },
      };
    }

    await this.whatsappService.startSession(clientId);

    const qr = this.qrStorageService.getQR(clientId);

    if (!qr) {
      return {
        status: 'waiting',
        message: 'QR ainda não disponível.',
      };
    }

    const qrBase64 = await QRCode.toDataURL(qr);

    return {
      status: 'ok',
      qr_base64: qrBase64,
    };
  }

  @Get('status/:clientId')
  getStatus(@Param('clientId') clientId: string) {
    const session = this.whatsappService.getSession(clientId);

    if (session) {
      const isConnected = session.ws.isOpen && session.user && session.user.id;
      const user = session.user;

      if (isConnected && user) {
        return {
          status: 'connected',
          clientId,
          user: {
            id: user.id,
            name: user.name,
          },
        };
      }
    }

    return {
      status: 'disconnected',
      clientId,
    };
  }

  @Get('logout/:clientId')
  async logout(@Param('clientId') clientId: string) {
    await this.whatsappService.logoutAndDelete(clientId);
    return {
      status: 'ok',
      message: `Sessão ${clientId} encerrada`,
    };
  }
}
