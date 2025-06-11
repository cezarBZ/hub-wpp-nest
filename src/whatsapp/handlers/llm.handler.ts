import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

function normalizePrompt(text: string): string {
  return text
    .normalize('NFD') // separa acentos
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^\w\s]/g, '') // remove pontuação
    .replace(/\s+/g, ' ') // substitui múltiplos espaços por 1
    .trim()
    .toLowerCase();
}

@Injectable()
export class LLMHandlerService {
  private readonly openai: OpenAI;

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateReply(
    systemPrompt: string,
    userMessage: string,
  ): Promise<string | null> {
    const normalizedMessage = normalizePrompt(userMessage);
    const cacheKey = `llm-response:${normalizedMessage}`;
    console.log(cacheKey);
    const cached = await this.cacheManager.get<string>(cacheKey);
    console.log('[CACHE] Value from Redis:', cached);

    if (cached) {
      console.log('[CACHE] Hit');
      return cached;
    }

    console.log('[CACHE] Miss - Chamando LLM');
    const res = await this.openai.chat.completions.create({
      model: 'gpt-4', // ou gpt-3.5-turbo
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
    });

    const reply = res.choices?.[0]?.message?.content;
    if (reply) {
      console.log('[CACHE] Salvando no Redis');
      await this.cacheManager.set(cacheKey, reply, 60 * 60); // 1h
    } else {
      console.log('[CACHE] Resposta LLM vazia');
    }

    return reply;
  }
}
