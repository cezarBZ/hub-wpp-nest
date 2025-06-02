// src/messages/schemas/message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  chatId: string;

  @Prop({ required: true })
  from: string;

  @Prop()
  text?: string;

  @Prop()
  type?: string;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true })
  fromMe: boolean;

  @Prop()
  repliedByLLM?: boolean;

  @Prop()
  llmResponse?: string;

  @Prop()
  mediaUrl?: string;

  @Prop()
  mimeType?: string;

  @Prop()
  fileName?: string;

  @Prop()
  duration?: number;

  @Prop()
  stickerEmoji?: string;

  @Prop({
    type: {
      text: String,
      type: String,
      fromMe: Boolean,
      from: String,
    },
  })
  quotedMessage?: {
    text?: string;
    type?: string;
    fromMe?: boolean;
    from?: string;
  };
}

export type MessageDocument = Message & Document;
export const MessageSchema = SchemaFactory.createForClass(Message);
