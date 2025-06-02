import { Injectable } from '@nestjs/common';
import { extractTextFromMessage } from '../utils/extract-text.util';
import { Message } from '../interfaces/message.interface';
import { extractQuotedMessage } from '../utils/extract-quoted-message.util';
import { isJidGroup, WAMessage } from 'baileys';
import { detectMessageType } from '../utils/detect-message-type.util';
import { extractMediaMeta } from '../utils/extract-media-meta.util';
import { WhatsappMedias } from '../interfaces/medias.type';

@Injectable()
export class MessageHandlerService {
  handleMessagesUpsert(messages: WAMessage[]) {
    for (const msg of messages) {
      const jid = msg.key.remoteJid ?? '';
      if (isJidGroup(jid)) continue;

      const messageType = detectMessageType(msg);
      const mediaMetadata = extractMediaMeta(
        msg,
        messageType as WhatsappMedias,
      );

      const msgToSave: Message = {
        text: extractTextFromMessage(msg),
        type: messageType,
        chatId: msg.key.remoteJid ?? '',
        fromMe: msg.key.fromMe ?? false,
        from: msg.pushName ?? '',
        timestamp: msg.messageTimestamp as number,
        repliedByLLM: false,
        quotedMessage: extractQuotedMessage(msg),
        ...mediaMetadata,
      };
      console.log(msgToSave);
    }
  }

  handleMessagingHistorySet = ({ messages }: any) => {
    console.log('📚 Sync messages:', messages);
  };
}
