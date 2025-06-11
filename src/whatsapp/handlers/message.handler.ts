import { Injectable } from '@nestjs/common';
import { extractTextFromMessage } from '../utils/extract-text.util';
import { Message } from '../interfaces/message.interface';
import { extractQuotedMessage } from '../utils/extract-quoted-message.util';
import { isJidGroup, MessageUpsertType, WAMessage } from 'baileys';
import { detectMessageType } from '../utils/detect-message-type.util';
import { extractMediaMeta } from '../utils/extract-media-meta.util';
import { WhatsappMedias } from '../interfaces/medias.type';
import { WebsocketService } from '../../websocket/websocket.service';
import { MessageService } from 'src/messages/message.service';
import { LLMHandlerService } from './llm.handler';
type parametersTypes = {
  type: MessageUpsertType;
  messages: WAMessage[];
  sock: any;
};
@Injectable()
export class MessageHandlerService {
  constructor(
    private readonly ws: WebsocketService,
    private readonly messageService: MessageService,
    private readonly llmService: LLMHandlerService,
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

  async gptResponder({ type, messages, sock }: parametersTypes) {
    const systemPrompt = `
  Você é atendente da loja Mens collection, especializada em moda masculina.
  Nosso horário é das 8 às 18 . Seja educado e objetivo.
  `;
    if (type === 'notify') {
      for (const msg of messages) {
        const jid = msg.key.remoteJid ?? '';
        const isJidGroups = isJidGroup(jid);

        if (!isJidGroups) {
          const userMessage = msg.message?.conversation;
          const gptReply = await this.llmService.generateReply(
            systemPrompt,
            userMessage ?? '',
          );
          await sock.sendMessage(msg.key.remoteJid!, { text: gptReply });

          const message: Message = {
            chatId: jid,
            fromMe: true,
            from: 'LLM',
            type: 'text',
            text: gptReply ?? undefined,
            timestamp: new Date().getDate(),
            repliedByLLM: true,
            quotedMessage: {
              type: detectMessageType(msg),
              text: extractTextFromMessage(msg),
              from: msg.pushName ?? undefined,
              fromMe: false,
            },
          };

          await this.messageService.save(message);
        }
      }
    }
  }

  handleMessagingHistorySet = ({ messages }: any) => {
    console.log('📚 Sync messages:', messages);
  };
}
