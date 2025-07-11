/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DisconnectReason } from 'baileys';
import { Boom } from '@hapi/boom';
import * as QRCode from 'qrcode';
import { WhatsappService } from '../whatsapp.service';
import { QRStorageService } from '../qr-storage.service';

@Injectable()
export class ConnectionHandlerService {
  private reconnectAttempts = new Map<string, number>();
  private maxReconnectAttempts = 5;
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private readonly qrStorageService: QRStorageService,
  ) {}

  async handleConnectionUpdate(update: any, clientId: string) {
    const { connection, lastDisconnect, qr } = update;
    const reasonCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

    console.log(
      `[ConnectionHandler] ${clientId} - Status: ${connection}, Reason: ${reasonCode}`,
    );

    if (qr) {
      this.qrStorageService.setQR(clientId, qr);
      console.log(`[ConnectionHandler] QR gerado para ${clientId}`);
      console.log(
        await QRCode.toString(qr, {
          type: 'terminal',
          small: true,
        }),
      );
    }

    if (connection === 'close') {
      await this.handleDisconnection(clientId, reasonCode);
    }

    if (connection === 'open') {
      console.log(`✅ ${clientId} conectado ao WhatsApp`);
      this.qrStorageService.clearQR(clientId);
      // Reset contador de tentativas de reconexão
      this.reconnectAttempts.delete(clientId);
      // Limpar timeout se existir
      this.clearReconnectTimeout(clientId);
    }

    if (connection === 'connecting') {
      console.log(`🔄 ${clientId} conectando...`);
    }
  }

  private async handleDisconnection(clientId: string, reasonCode: number) {
    console.log(`❌ ${clientId} desconectado. Código: ${reasonCode}`);

    // Limpar timeout anterior se existir
    this.clearReconnectTimeout(clientId);

    switch (reasonCode) {
      case DisconnectReason.badSession:
        console.log(`🔄 ${clientId} - Sessão ruim, limpando e recriando...`);
        await this.whatsappService.logoutAndDelete(clientId);
        break;

      case DisconnectReason.connectionClosed:
        console.log(`🔄 ${clientId} - Conexão fechada, tentando reconectar...`);
        this.scheduleReconnect(clientId, 3000);
        break;

      case DisconnectReason.connectionLost:
        console.log(`🔄 ${clientId} - Conexão perdida, tentando reconectar...`);
        this.scheduleReconnect(clientId, 5000);
        break;

      case DisconnectReason.connectionReplaced:
        console.log(`⚠️ ${clientId} - Conexão substituída em outro lugar`);
        await this.whatsappService.logoutAndDelete(clientId);
        break;

      case DisconnectReason.loggedOut:
        console.log(`❌ ${clientId} - Logout detectado, limpando sessão...`);
        await this.whatsappService.logoutAndDelete(clientId);
        break;

      case DisconnectReason.restartRequired:
        console.log(`🔄 ${clientId} - Restart necessário, reiniciando...`);
        this.scheduleReconnect(clientId, 2000);
        break;

      case DisconnectReason.timedOut:
        console.log(`⏰ ${clientId} - Timeout, tentando reconectar...`);
        this.scheduleReconnect(clientId, 10000);
        break;

      case DisconnectReason.unavailableService:
        console.log(
          `❌ ${clientId} - Serviço indisponível, tentando mais tarde...`,
        );
        this.scheduleReconnect(clientId, 30000);
        break;

      case 503: // Stream error
        console.log(`🔄 ${clientId} - Erro de stream (503), reconectando...`);
        this.scheduleReconnect(clientId, 5000);
        break;

      default:
        console.log(
          `❓ ${clientId} - Desconexão desconhecida (${reasonCode}), tentando reconectar...`,
        );
        this.scheduleReconnect(clientId, 5000);
        break;
    }
  }

  private scheduleReconnect(clientId: string, delay: number) {
    const attempts = this.reconnectAttempts.get(clientId) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.log(
        `❌ ${clientId} - Máximo de tentativas de reconexão atingido (${this.maxReconnectAttempts})`,
      );
      this.reconnectAttempts.delete(clientId);
      return;
    }

    this.reconnectAttempts.set(clientId, attempts + 1);

    // Backoff exponencial: delay * (2 ^ attempts)
    const backoffDelay = delay * Math.pow(2, attempts);
    const maxDelay = 300000; // 5 minutos máximo
    const finalDelay = Math.min(backoffDelay, maxDelay);

    console.log(
      `🔄 ${clientId} - Agendando reconexão em ${finalDelay}ms (tentativa ${attempts + 1}/${this.maxReconnectAttempts})`,
    );

    const timeout = setTimeout(async () => {
      try {
        console.log(`🔄 ${clientId} - Executando reconexão...`);
        await this.whatsappService.forceRestartSession(clientId);
      } catch (error) {
        console.error(`❌ ${clientId} - Erro na reconexão:`, error);
        // Tentar novamente após um delay maior
        this.scheduleReconnect(clientId, finalDelay);
      }
    }, finalDelay);

    this.reconnectTimeouts.set(clientId, timeout);
  }

  private clearReconnectTimeout(clientId: string) {
    const timeout = this.reconnectTimeouts.get(clientId);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(clientId);
    }
  }

  // Método para limpar recursos quando o serviço for destruído
  onModuleDestroy() {
    // Limpar todos os timeouts
    for (const [timeout] of this.reconnectTimeouts) {
      clearTimeout(timeout);
    }
    this.reconnectTimeouts.clear();
    this.reconnectAttempts.clear();
  }
}
