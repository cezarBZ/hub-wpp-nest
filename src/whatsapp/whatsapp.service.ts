import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import makeWASocket, {
  WASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from 'baileys';
import P from 'pino';
import { ConnectionHandlerService } from './handlers/connection.handler';
import { MessageHandlerService } from './handlers/message.handler';
import { SessionHandlerService } from './handlers/session.handler';
import { SendOrderMessageDto } from './dto/send-order-message.dto';
import { SendStoreCreatedMessageDto } from './dto/send-store-created-message.dto';
import * as Path from 'path';
import * as fs from 'fs';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private sessions = new Map<string, WASocket>();

  async onModuleInit() {
    const authRoot = Path.join(process.cwd(), 'baileys_auth');
    if (!fs.existsSync(authRoot)) return;

    const clientIds = fs
      .readdirSync(authRoot, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const clientId of clientIds) {
      try {
        await this.startSession(clientId);
        console.log(`[WA] Sessão restaurada para ${clientId}`);
      } catch (err) {
        console.error(`[WA] Falha ao restaurar sessão ${clientId}:`, err);
      }
    }
  }
  constructor(
    private readonly messageHandler: MessageHandlerService,
    private readonly connectionHandler: ConnectionHandlerService,
    private readonly sessionHandler: SessionHandlerService,
  ) {}

  async startSession(clientId: string): Promise<WASocket | undefined> {
    if (this.sessions.has(clientId)) {
      const existingSession = this.sessions.get(clientId);
      console.log(`[WA] Sessão ${clientId} já existe`);
      return existingSession;
    }

    console.log(`[WA] Criando nova sessão para ${clientId}...`);
    const authFolder = `baileys_auth/${clientId}`;
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: P({ level: 'info' }),
      auth: state,
    });

    // Armazenar a sessão imediatamente
    this.sessions.set(clientId, sock);

    sock.ev.on('creds.update', () =>
      this.sessionHandler.handleCredsUpdate(saveCreds),
    );

    sock.ev.on('connection.update', (update) =>
      this.connectionHandler.handleConnectionUpdate(update, clientId),
    );

    // sock.ev.on('messages.upsert', (event) =>
    //   this.messageHandler.handleMessagesUpsert(event.messages),
    // );

    // sock.ev.on('messages.upsert', (event) =>
    //   this.messageHandler.gptResponder({
    //     messages: event.messages,
    //     sock: sock,
    //     type: event.type,
    //   }),
    // );

    return sock;
  }
  async forceRestartSession(clientId: string): Promise<WASocket | undefined> {
    console.log(`[WA] Forçando restart da sessão ${clientId}`);
    await this.closeSession(clientId);
    return await this.startSession(clientId);
  }

  getSession(clientId: string): WASocket | undefined {
    return this.sessions.get(clientId);
  }

  async closeSession(clientId: string) {
    const session = this.sessions.get(clientId);
    if (session) {
      const isOpen = session.ws.isConnecting || session.ws.isOpen;

      if (isOpen) {
        try {
          await session.logout();
          console.log(`[WA] Logout feito para ${clientId}`);
        } catch (error) {
          console.warn(
            `[WA] Erro ao fazer logout da sessão ${clientId} (provavelmente a conexão já estava fechada):`,
            error.message,
          );
        }
      } else {
        console.log(
          `[WA] Sessão ${clientId} já estava desconectada, pulando logout.`,
        );
      }

      this.sessions.delete(clientId);
    } else {
      console.log(`[WA] Sessão ${clientId} não encontrada para closeSession.`);
    }
  }

  async logoutAndDelete(clientId: string) {
    const session = this.sessions.get(clientId);
    const fs = await import('fs/promises');
    const authFolder = Path.join('baileys_auth', clientId);

    if (session) {
      const isOpen = session.ws.isConnecting || session.ws.isOpen;
      if (isOpen) {
        try {
          await session.logout();
        } catch (error) {
          console.warn(
            `[WA] Erro ao fazer logout da sessão ${clientId}:`,
            error.message,
          );
        }
      }
      this.sessions.delete(clientId);
    }

    try {
      await fs.rm(authFolder, { recursive: true, force: true });
      console.log(`[WA] Dados da sessão ${clientId} removidos.`);
    } catch (error) {
      console.error(`[WA] Erro ao deletar pasta ${authFolder}:`, error);
    }
  }

  async sendOrderConfirmation(data: SendOrderMessageDto, clientId: string) {
    const jid = `${data.phone}@s.whatsapp.net`;
    const session = this.sessions.get(clientId);
    if (!session) return false;

    try {
      await session.sendMessage(jid, { text: data.message });
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw new InternalServerErrorException(
        'Falha ao enviar mensagem no WhatsApp',
      );
    }
  }

  async sendStoreWelcomeMessage(
    data: SendStoreCreatedMessageDto,
    clientId: string,
  ) {
    const message = `Parabéns ${data.ownerName}! Sua loja "${data.storeName}" foi criada com sucesso. Seja bem-vindo ao nosso catálogo!`;
    const session = this.sessions.get(clientId);
    if (!session) return false;

    await session.sendMessage(`${data.phone}@s.whatsapp.net`, {
      text: message,
    });
    return { success: true };
  }
}
