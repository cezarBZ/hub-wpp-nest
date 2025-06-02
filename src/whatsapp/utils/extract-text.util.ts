export const extractTextFromMessage = (msg: any): string | undefined => {
  const raw = msg.message;

  if (!raw) return;

  if (raw.conversation) return raw.conversation;

  if (raw.extendedTextMessage) return raw.extendedTextMessage.text;

  if (raw.ephemeralMessage) {
    return extractTextFromMessage({ message: raw.ephemeralMessage.message });
  }

  if (raw.viewOnceMessage) {
    return extractTextFromMessage({ message: raw.viewOnceMessage.message });
  }

  return;
};
