import { WAMessage } from 'baileys';

export function detectMessageType(msg: WAMessage): string {
  const m = msg.message;
  const key = msg.key;

  if (!m) return 'unknown';

  if (m.conversation || m.extendedTextMessage) return 'text';
  if (m.imageMessage) return 'imageMessage';
  if (m.videoMessage) return 'videoMessage';
  if (m.audioMessage) return 'audioMessage';
  if (m.documentMessage) return 'documentMessage';
  if (m.stickerMessage) return 'stickerMessage';
  if (m.contactMessage) return 'contact';
  if (m.locationMessage) return 'location';
  if (m.buttonsMessage) return 'button';

  if (m.ephemeralMessage) {
    return detectMessageType({ message: m.ephemeralMessage.message, key: key });
  }

  if (m.viewOnceMessage) {
    return detectMessageType({ message: m.viewOnceMessage.message, key: key });
  }

  return 'unknown';
}
