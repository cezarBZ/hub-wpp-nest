export interface Message {
  chatId: string;
  from: string;
  text?: string | null;
  type: string;
  timestamp?: number | null;
  fromMe: boolean;
  repliedByLLM?: boolean | null;
  llmResponse?: string | null;
  mediaUrl?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  duration?: number | null;
  stickerEmoji?: string | null;
  quotedMessage?: {
    type: string;
    text?: string;
    fromMe: boolean;
    from?: string | null;
  } | null;
}
