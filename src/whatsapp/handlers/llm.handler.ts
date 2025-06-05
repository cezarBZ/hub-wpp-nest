import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class LLMHandlerService {
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateReply(
    systemPrompt: string,
    userMessage: string,
  ): Promise<string | null> {
    const res = await this.openai.chat.completions.create({
      model: 'gpt-4', // ou gpt-3.5-turbo
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
    });

    return res.choices?.[0]?.message?.content;
  }
}
