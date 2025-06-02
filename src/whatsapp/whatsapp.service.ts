// src/whatsapp/whatsapp.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from 'baileys';
import P from 'pino';
import { MessageHandlerService } from './handlers/message.handler';
import { ConnectionHandlerService } from './handlers/connection.handler';
import { SessionHandlerService } from './handlers/session.handler';
// import { MessageRepository } from '../../modules/messages/message.repository';

@Injectable()
export class WhatsappService implements OnModuleInit {
  constructor(
    private readonly messageHandler: MessageHandlerService,
    private readonly connectionHandler: ConnectionHandlerService,
    private readonly sessionHandler: SessionHandlerService,
  ) {}
  private sock: ReturnType<typeof makeWASocket>;

  async onModuleInit() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      logger: P({ level: 'info' }),
      auth: state,
    });

    this.sock.ev.on('creds.update', () =>
      this.sessionHandler.handleCredsUpdate(saveCreds),
    );
    this.sock.ev.on('connection.update', (update) =>
      this.connectionHandler.handleConnectionUpdate(update),
    );
    this.sock.ev.on(
      'messaging-history.set',
      this.messageHandler.handleMessagingHistorySet,
    );
    this.sock.ev.on('messages.upsert', (event) =>
      this.messageHandler.handleMessagesUpsert(event.messages),
    );
  }

  async sendMessage(number: string, message: string) {
    const jid = number.includes('@s.whatsapp.net')
      ? number
      : `${number}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, { text: message });
    console.log(`[WA] Mensagem enviada para ${number}: ${message}`);
  }
}
