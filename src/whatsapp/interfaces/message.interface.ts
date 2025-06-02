export interface Message {
  chatId: string;
  from: string;
  text?: string;
  type: string;
  timestamp?: number;
  fromMe: boolean;
  repliedByLLM?: boolean;
  llmResponse?: string;
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
  duration?: number;
  stickerEmoji?: string;
  quotedMessage?: {
    type: string;
    text?: string;
    fromMe: boolean;
    from?: string;
  };
}
