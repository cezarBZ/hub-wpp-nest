import { Injectable } from '@nestjs/common';
import { extractTextFromMessage } from '../utils/extract-text.util';
import { Message } from '../interfaces/message.interface';
import { extractQuotedMessage } from '../utils/extract-quoted-message.util';
import { isJidGroup, WAMessage } from 'baileys';
import { detectMessageType } from '../utils/detect-message-type.util';
import { extractMediaMeta } from '../utils/extract-media-meta.util';
import { WhatsappMedias } from '../interfaces/medias.type';
import { WebsocketService } from '../../websocket/websocket.service';
import { MessageService } from 'src/messages/message.service';

@Injectable()
export class MessageHandlerService {
  constructor(
    private readonly ws: WebsocketService,
    private readonly messageService: MessageService,
  ) {}

  async handleMessagesUpsert(messages: WAMessage[]) {
    for (const msg of messages) {
      const jid = msg.key.remoteJid ?? '';
      if (isJidGroup(jid)) continue;

      const messageType = detectMessageType(msg);
      const mediaMetadata = extractMediaMeta(
        msg,
        messageType as WhatsappMedias,
      );
      const text = extractTextFromMessage(msg) ?? undefined;
      const shouldSkip = !text && !mediaMetadata?.mediaUrl;

      if (shouldSkip) {
        continue;
      }

      if (!msg.message) {
        console.log('🔍 Mensagem ignorada (sem conteúdo):', msg);
        continue;
      }

      const msgToSave: Message = {
        text: text,
        type: messageType,
        chatId: msg.key.remoteJid ?? '',
        fromMe: msg.key.fromMe ?? false,
        from: msg.pushName ?? 'Desconhecido',
        timestamp: msg.messageTimestamp as number,
        repliedByLLM: false,
        quotedMessage: extractQuotedMessage(msg),
        ...mediaMetadata,
      };

      this.ws.broadcast({ type: 'new_message', data: msg.message });
      await this.messageService.save(msgToSave);
    }
  }

  handleMessagingHistorySet = ({ messages }: any) => {
    console.log('📚 Sync messages:', messages);
  };
}
