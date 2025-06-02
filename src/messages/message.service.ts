// src/messages/message.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async save(msg: Partial<Message>): Promise<Message> {
    return await this.messageModel.create(msg);
  }

  async getByChat(chatId: string, limit = 20): Promise<Message[]> {
    return await this.messageModel
      .find({ chatId })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async findLastMessage(chatId: string): Promise<Message | null> {
    return await this.messageModel.findOne({ chatId }).sort({ timestamp: -1 });
  }
}
