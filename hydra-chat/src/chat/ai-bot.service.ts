import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ChatService } from './chat.service.js';
import { SearchClientService } from '../search/search-client.service.js';

const SEARCH_TOOL: Groq.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_cards',
    description: 'Search for Magic: The Gathering cards in the Hydra Collectables inventory.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Card name to search for' },
      },
      required: ['query'],
    },
  },
};

@Injectable()
export class AiBotService {
  private readonly logger = new Logger(AiBotService.name);
  private groq: Groq;
  private readonly enabled: boolean;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
    private readonly searchService: SearchClientService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not set — AI bot disabled');
      this.enabled = false;
      return;
    }
    this.enabled = true;
    this.groq = new Groq({ apiKey });
    this.frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000')
      .split(',')[0]
      .trim();
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async reply(userId: string, userMessage: string): Promise<string | null> {
    if (!this.enabled) return null;

    try {
      const history = await this.chatService.getHistory(userId, 20);
      const prior = history.slice(0, -1);

      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        { role: 'system' as const, content: this.systemPrompt() },
        ...prior.map((msg) => ({
          role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.content,
        })),
        { role: 'user' as const, content: userMessage },
      ];

      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        tools: [SEARCH_TOOL],
        tool_choice: 'auto',
        max_tokens: 512,
        temperature: 0.4,
      });

      const choice = response.choices[0];

      if (choice.message.tool_calls?.length) {
        const call = choice.message.tool_calls[0];
        const args = JSON.parse(call.function.arguments) as { query: string };
        this.logger.log(`Bot searching: "${args.query}"`);

        const results = await this.searchService.searchHybrid(args.query, 1, 6);
        const items = results.data.slice(0, 6).map((item: any) => ({
          name: item.cardName || item.name,
          expansion: item.expansion || item.variant || '',
          price: item.price ?? item.finalPrice,
          stock: item.stock ?? null,
          condition: item.condition || '',
          language: item.language || '',
          foil: item.foil ?? false,
          isLocal: item.isLocalInventory ?? false,
          tcgId: item.tcg_id || item.tcgId || '',
        }));

        const firstTcgId = items[0]?.tcgId;
        const searchUrl = `${this.frontendUrl}/search?query=${encodeURIComponent(args.query)}${firstTcgId ? `&tcgId=${firstTcgId}` : ''}`;

        const followUp = await this.groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            ...messages,
            { role: 'assistant' as const, content: null, tool_calls: choice.message.tool_calls },
            {
              role: 'tool' as const,
              tool_call_id: call.id,
              content: JSON.stringify({ found: items.length > 0, results: items, searchUrl }),
            },
          ],
          max_tokens: 512,
          temperature: 0.4,
        });

        return followUp.choices[0]?.message?.content ?? null;
      }

      return choice.message.content ?? null;
    } catch (err) {
      if (err?.status === 429) {
        this.logger.warn('AI bot quota exceeded (429)');
        return 'En este momento el asistente automático no está disponible. Un agente de soporte te atenderá pronto.';
      }
      this.logger.error('AI bot error:', err);
      return null;
    }
  }

  private systemPrompt(): string {
    return `
Eres el asistente de soporte de "Hydra Collectables", una tienda premium de cartas Magic: The Gathering en México.
Respondes SIEMPRE en español, con tono profesional y amigable.

LÍMITE DE ALCANCE:
Solo puedes responder temas directamente relacionados con Hydra Collectables o Magic: The Gathering.
Si el usuario pregunta cualquier cosa completamente AJENA a la tienda o a Magic, responde EXACTAMENTE:
"Solo puedo ayudarte con temas relacionados a Hydra Collectables y Magic: The Gathering. ¿Tienes alguna pregunta sobre la tienda o las cartas?"

POLÍTICAS Y RESPUESTAS CLAVE:
1. ESTADO: Hydra Collectables está 100% activa y operando con total normalidad.
2. CORREO: soporte@hydracollectables.com (respuesta en menos de 24 horas).
3. HORARIOS: lunes a viernes de 9:00 AM a 6:00 PM (hora del centro de México).
4. FORMAS DE PAGO: Mercado Pago (tarjetas/débito), SPEI, Wallet, Google Pay, pagos combinados.
5. ENVÍO: $280 MXN tarifa plana a todo México. Gratis en compras de $3,000 MXN o más.
6. TIEMPOS: Locales 3-5 días hábiles. Importación aprox. 30 días hábiles + 3 días de envío.
7. BÚSQUEDA: SIEMPRE usa search_cards cuando pregunten por cartas, precios, stock, edición, idioma, condición o foil.
   Incluye siempre el searchUrl como enlace Markdown al presentar resultados.
   Si isLocal=true → "Disponible en tienda / Listo para enviar". Si isLocal=false → "Disponible para importación".
8. ESCALABILIDAD: Si el usuario pide hablar con un agente, informa que se ha notificado al equipo y proporciona soporte@hydracollectables.com.
`;
  }
}
