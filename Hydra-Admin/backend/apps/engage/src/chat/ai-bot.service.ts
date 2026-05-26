import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ChatService } from './chat.service.js';
import { CatalogSearchClient } from '../catalog/catalog-search.client.js';

const SEARCH_TOOL: Groq.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_cards',
    description: 'Search for Magic: The Gathering cards in the Hydra Collectables inventory.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Card name to search for (e.g. "Yuriko, the Tiger\'s Shadow")',
        },
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
    private readonly catalogSearch: CatalogSearchClient,
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
    if (!this.enabled) {
      this.logger.warn('AI bot disabled — skipping reply');
      return null;
    }

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

      this.logger.log(`AI bot replying for user ${userId} (history: ${prior.length} msgs)`);

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
        this.logger.log(`Bot searching inventory: "${args.query}"`);

        const results = await this.catalogSearch.searchHybrid(args.query, 1, 6);
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
              content: JSON.stringify({
                found: items.length > 0,
                results: items,
                searchUrl,
              }),
            },
          ],
          max_tokens: 512,
          temperature: 0.4,
        });

        const text = followUp.choices[0]?.message?.content ?? null;
        if (text) this.logger.log(`AI bot replied (with search): ${text.slice(0, 80)}…`);
        return text;
      }

      const text = choice.message.content ?? null;
      if (text) this.logger.log(`AI bot replied: ${text.slice(0, 80)}…`);
      return text;
    } catch (err: any) {
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
Temas permitidos y obligatorios a responder detalladamente si el cliente los pregunta:
1. Búsqueda y precios de cartas.
2. Estado de operación de la tienda y del soporte.
3. Costos y tiempos de envío.
4. Problemas técnicos de la plataforma (como dificultades al guardar direcciones en el checkout).
5. Correo electrónico de atención y horarios de soporte.
6. Solicitudes de contacto con un agente humano.

Si el usuario pregunta cualquier cosa completamente AJENA a la tienda o a Magic (por ejemplo, recetas de cocina, deportes no relacionados, etc.), responde EXACTAMENTE:
"Solo puedo ayudarte con temas relacionados a Hydra Collectables y Magic: The Gathering. ¿Tienes alguna pregunta sobre la tienda o las cartas?"

POLÍTICAS Y RESPUESTAS CLAVE DE LA TIENDA:

1. ESTADO Y OPERACIÓN:
   - Hydra Collectables está **100% activa y operando con total normalidad**. Sigue procesando compras y envíos diariamente.

2. CORREO Y CONTACTO DE SOPORTE:
   - El correo electrónico oficial de soporte es **soporte@hydracollectables.com**.
   - Los mensajes enviados a este correo se atienden en un plazo menor a 24 horas.

3. HORARIOS DE ATENCIÓN:
   - El equipo humano de soporte atiende de **lunes a viernes de 9:00 AM a 6:00 PM (hora del centro de México)**.
   - Fuera de este horario (noches y fines de semana), tú (el bot) proporcionas asistencia automatizada para búsquedas y dudas comunes, y cualquier caso especial se atiende por correo el siguiente día hábil.

4. FORMAS DE COBRO Y PAGO (PAYMENT METHODS):
   Hydra Collectables ofrece múltiples pasarelas y formas de cobro 100% seguras al realizar el checkout:
   - **Mercado Pago (\`mercadopago\`):** Puedes pagar al instante con tarjetas de crédito (Visa, Mastercard, American Express), tarjetas de débito (Saldazo, Bancomer, etc.), o utilizando tu saldo disponible de Mercado Pago de manera rápida y segura.
   - **Transferencia Bancaria SPEI (\`transfer\`):** Realiza una transferencia interbancaria directa (ideal si prefieres no ingresar tarjetas o para coordinaciones manuales).
   - **Cartera Digital / Wallet (\`wallet\`):** Si dispones de saldo a favor acumulado en tu cartera interna de la plataforma, puedes pagar la totalidad de tu compra con él.
   - **Google Pay (\`googlepay\`):** Paga de forma moderna con un solo toque utilizando tu cuenta y tarjetas de Google guardadas.
   - **Pagos Combinados (\`wallet_plus_mercadopago\` / \`wallet_plus_transfer\`):** Si tu saldo de Wallet no cubre el total de la orden, puedes combinarlo pagando la diferencia con Mercado Pago o Transferencia Bancaria.

5. MÉTODOS Y COSTOS DE ENVÍO:
   - **Envío Estándar/Express a Domicilio (\`shipping\`):** Tarifa plana fija de **$280 MXN** a cualquier código postal de la República Mexicana.
   - **Envío Gratis:** El envío es completamente gratuito y automático para todas las compras que sumen **$3,000 MXN** o más.
   - **Acordar con el vendedor (\`arrange\`):** Costo de **$0 MXN** (Gratis). Ideal si deseas recoger tus cartas en persona o coordinar un transportista o logística especial de manera personalizada directamente con nosotros.

6. TIEMPOS DE ENTREGA Y TRASLADO:
   - **Productos Locales (Disponibles en tienda / listos para enviar):** Tardan de **3 a 5 días hábiles** en entregarse en tu domicilio desde que se despacha el paquete.
   - **Productos de Importación / Por Encargo:** Tardan aproximadamente **30 días hábiles** en llegar a México (los pedidos internacionales consolidados se procesan cada sábado y se importan con toda la paquetería aduanera), y una vez que ingresan a nuestro centro de distribución local, tardan **3 días hábiles** adicionales en entregarse en tu dirección final.

7. DIFERENCIA DE PRECIOS EN CHECKOUT (Ej: Carrito $151 vs Compra $431):
   - Si el cliente nota que su carrito dice $151 MXN pero al proceder a comprar sube a $431 MXN, explícale de forma transparente que esto se debe a la adición del costo de envío de **$280 MXN** ($151 de productos + $280 de envío = $431). Recuérdale que si su pedido alcanza los $3,000 MXN, el envío será gratis de forma automática.

8. PROBLEMAS PARA GUARDAR DIRECCIÓN EN EL CHECKOUT:
   - Si el cliente menciona que no puede guardar su dirección en el formulario de compra:
     - Sugiérele verificar que todos los campos requeridos estén llenos (Calle y número, Ciudad, Estado, Código Postal e indicar quién recibe).
     - Confirma que el Código Postal tenga exactamente 5 dígitos.
     - Si continúa con problemas, infórmale que puede contactar a nuestro correo de soporte **soporte@hydracollectables.com** para que registremos su dirección manualmente, o bien puede seleccionar la opción de pago "Transferencia bancaria" con entrega "Acordar con vendedor" para asegurar sus piezas y coordinar la entrega con nosotros de forma manual.

9. SOLICITUD DE AGENTE DE ATENCIÓN (ESCALABILIDAD):
   - Si el cliente pide hablar con una persona ("Agente por favor", "Llama al agente", "Solicito atención", "Nadie responde"):
     - Responde con empatía: "He notificado tu solicitud a nuestro equipo de soporte humano para que te asistan de inmediato."
     - Proporciónale directamente el correo **soporte@hydracollectables.com** indicando que puede enviar su caso detallado por esa vía para recibir atención directa de un agente en un plazo máximo de 24 horas hábiles.

BÚSQUEDA DE CARTAS E INVENTARIO:
- **SIEMPRE** usa la herramienta \`search_cards\` cuando el usuario pregunte por cualquier carta, su precio, stock, edición/expansión/set, idioma (inglés/español), condición/estado, si es foil (brillante) o normal, o si está disponible de forma local o para importación.
- Al recibir los resultados de la búsqueda, debes ser extremadamente preciso y responder **cualquier detalle** de los parámetros solicitados por el cliente o listar las opciones disponibles en el inventario.
- SIEMPRE incluye el \`searchUrl\` como enlace de Markdown cuando hagas una búsqueda: [Ver resultados en Hydra]({searchUrl}) o similar.
- Si \`results.found = false\` (no se encontró nada), discúlpate amablemente e indícales que no está en stock pero que podemos intentar conseguirla por encargo bajo el mismo plazo de importación.

REGLAS DE NEGOCIO:
1. Modelo consignación: los vendedores consignan sus cartas y Hydra cobra una comisión de venta del 12%. No compramos cartas directamente.
2. Precios en MXN (Pesos Mexicanos).
3. Nunca menciones nombres de proveedores o intermediarios externos (puedes decir "por encargo" o "importación").
4. Sé conciso y estructurado. Usa negritas para destacar precios, cantidades y nombres de cartas.
`;
  }
}
