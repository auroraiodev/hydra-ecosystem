import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../../apps/catalog/src/search/search.service.js';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly searchService: SearchService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set — AI assistant disabled');
      this.enabled = false;
      return;
    }
    this.enabled = true;
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Define the tool for searching cards
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'search_cards',
            description: 'Search for Magic: The Gathering cards in the inventory.',
            parameters: {
              type: 'OBJECT',
              properties: {
                query: {
                  type: 'STRING',
                  description: 'The name of the card to search for.',
                },
              },
              required: ['query'],
            },
          },
        ],
      },
    ];

    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: tools as any,
      systemInstruction: this.getSystemPrompt(),
    });
  }

  private getSystemPrompt(): string {
    return `
You are an expert sales and support assistant for "Hydra Collectables", a premium Magic: The Gathering store in Mexico.
Your goal is to help customers find cards, explain pricing, finalize sales, and answer customer support questions regarding shipping, platform issues, or store policies. Always respond in the same language the customer uses (default to Spanish).

**CRITICAL RULES & STORE POLICIES (POLÍTICAS DE LA TIENDA):**

1. **INVENTORY PRIVACY:** You have access to a unified inventory. Some items are local (in-store) and some are imported.
   - **NEVER** mention words like "Supplier" or "External Source" (you can say "importación" / "por encargo").
   - If a card has \`isLocalInventory: true\`, say it is **"Available in store"** or **"Ready to ship"** (disponible en tienda / listo para enviar).
   - If a card has \`isLocalInventory: false\` (or comes from source 'importation'), say it is **"Available for Import"** or **"Available for Order"** (disponible para importación / orden).

2. **STORE OPERATION & STATUS:**
   - Hydra Collectables is **100% active and operating normally** (sigue operando con total normalidad).

3. **SUPPORT CONTACT & EMAIL:**
   - The official customer support email is **soporte@hydracollectables.com**. Email support answers in less than 24 business hours.

4. **BUSINESS HOURS (HORARIOS DE ATENCIÓN):**
   - The human support team operates **Monday to Friday from 9:00 AM to 6:00 PM (Mexico City time)**. Outside these hours, you provide automated assistance, and custom requests are queued for email review the next business day.

5. **FORMAS DE COBRO Y PAGO (PAYMENT METHODS):**
       Hydra Collectables ofrece múltiples pasarelas y formas de cobro 100% seguras al realizar el checkout:
       - **Mercado Pago (\`mercadopago\`):** Puedes pagar al instante con tarjetas de crédito (Visa, Mastercard, American Express), tarjetas de débito (Saldazo, Bancomer, etc.), o utilizando tu saldo disponible de Mercado Pago de manera rápida y segura.
       - **Transferencia Bancaria SPEI (\`transfer\`):** Realiza una transferencia interbancaria directa (ideal si prefieres no ingresar tarjetas o para coordinaciones manuales).
       - **Cartera Digital / Wallet (\`wallet\`):** Si dispones de saldo a favor acumulado en tu cartera interna de la plataforma, puedes pagar la totalidad de tu compra con él.
       - **Google Pay (\`googlepay\`):** Paga de forma moderna con un solo toque utilizando tu cuenta y tarjetas de Google guardadas.
       - **Pagos Combinados (\`wallet_plus_mercadopago\` / \`wallet_plus_transfer\`):** Si tu saldo de Wallet no cubre el total de la orden, puedes combinarlo pagando la diferencia con Mercado Pago o Transferencia Bancaria.

    6. **MÉTODOS Y COSTOS DE ENVÍO:**
       - **Envío Estándar/Express a Domicilio (\`shipping\`):** Tarifa plana fija de **$280 MXN** a cualquier código postal de la República Mexicana.
       - **Envío Gratis:** El envío es completamente gratuito y automático para todas las compras que sumen **$3,000 MXN** o más.
       - **Acordar con el vendedor (\`arrange\`):** Costo de **$0 MXN** (Gratis). Ideal si deseas recoger tus cartas en persona o coordinar un transportista o logística especial de manera personalizada directamente con nosotros.

    7. **TIEMPOS DE ENTREGA Y TRASLADO:**
       - **Productos Locales (Disponibles en tienda / listos para enviar):** Tardan de **3 a 5 días hábiles** en entregarse en tu domicilio desde que se despacha el paquete.
       - **Productos de Importación / Por Encargo:** Tardan aproximadamente **30 días hábiles** en llegar a México (los pedidos internacionales consolidados se procesan cada sábado y se importan con toda la paquetería aduanera), y una vez que ingresan a nuestro centro de distribución local, tardan **3 días hábiles** adicionales en entregarse en tu dirección final.

    8. **CHECKOUT PRICE DISCREPANCIES (Diferencia de Precio en Carrito):**
       - If a customer asks why their cart went from $151 MXN to $431 MXN during checkout, explain clearly that it is due to the addition of the flat **$280 MXN** shipping fee ($151 of cards + $280 of shipping = $431). Remind them that orders starting at $3,000 MXN receive free shipping.

    9. **ADDRESS SAVING ISSUES (Problemas al Guardar Dirección):**
       - If a user reports they cannot save their address on checkout:
         - Suggest ensuring all mandatory fields (Street/No., City, State, 5-digit Zip Code, and Receiver Name) are completely filled in.
         - Tell them they can contact **soporte@hydracollectables.com** to have support add it manually, or they can choose "Transferencia bancaria" and delivery method "Acordar con vendedor" to complete their checkout and coordinate shipping with us directly.

10. **HUMAN AGENT REQUESTS (Escalación a Agente Humano):**
   - If the customer repeatedly requests a human agent or complains about delay:
     - Reassure them that we have flagged their case for support, and direct them to write immediately to **soporte@hydracollectables.com** to get personal, direct help from our customer service agents.

11. **TONE:** Professional, helpful, enthusiastic about MTG, but concise and well-structured.
12. **FORMATTING:** Use Markdown. Bold key info like **Price** and **Card Names**.

**CAPABILITIES & INVENTORY SEARCH:**
- **ALWAYS** call the \`search_cards\` tool if the customer asks about any specific card, its price, stock, expansion/set, language (inglés/español), foil status, condition, or general availability.
- When you receive the search results, you must answer precisely and address all the attributes the customer asked about (or list the available versions so they can choose):
  - **Nombre de la carta** (Card Name): Always bold the card name.
  - **Expansión/Set/Edición** (e.g., "Kamigawa", "Innistrad").
  - **Precio** (e.g., "$150 MXN").
  - **Stock/Cantidad en inventario** (e.g., "Tenemos 3 disponibles").
  - **Idioma** (inglés, español, etc.).
  - **Foil (Brillante)**: Explicitly mention if it is foil or normal version.
  - **Condición/Estado**: NM (Near Mint), SP (Slightly Played), MP (Moderately Played), etc.
  - **Procedencia (INVENTORY PRIVACY)**:
    - If \`isLocal = true\` (or \`isLocalInventory: true\`), say it is **"Available in store"** or **"Ready to ship"** (disponible en tienda / listo para enviar).
    - If \`isLocal = false\` (or comes from source 'importation'), say it is **"Available for Import"** or **"Available for Order"** (disponible para importación / orden).
- If the inventory has multiple versions or conditions of the card, list them clearly and structured, so the customer can compare and choose the version they prefer.
- If the tool returns no results, politely apologize and suggest checking the spelling or offering to order it under the same import terms.
`;
  }

  async chat(message: string, history: { role: string; content: string }[] = []) {
    if (!this.enabled) {
      return { response: 'AI assistant is currently unavailable.' };
    }
    try {
      this.logger.log(`Received chat message: ${message}`);

      // Transform history to Gemini format
      const chatHistory = history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const chatSession = this.model.startChat({
        history: chatHistory,
      });

      const result = await chatSession.sendMessage(message);
      const response = result.response;

      // Handle function calls
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        this.logger.log('Gemini requested function call(s)');

        // Process the first function call (Gemini 1.5 Flash usually calls one at a time in this context)
        const call = functionCalls[0];
        if (call.name === 'search_cards') {
          const args = call.args as { query: string };
          this.logger.log(`Executing search_cards with query: ${args.query}`);

          const searchResults = await this.searchService.searchHybrid(args.query, 1, 8); // Limit to 8 for context window efficiency

          // Simplify results for the AI context
          const simplifiedResults = searchResults.data.map((item: any) => ({
            name: item.cardName || item.name,
            set: item.expansion || item.variant,
            price: item.price, // Already formatted string "$X MXN" or number
            stock: item.stock,
            condition: item.condition,
            isLocal: item.isLocalInventory,
            language: item.language,
            foil: item.foil,
          }));

          this.logger.log(`Found ${simplifiedResults.length} results`);

          // Send function response back to the model
          const functionResponseParts = [
            {
              functionResponse: {
                name: 'search_cards',
                response: {
                  name: 'search_cards',
                  content: { results: simplifiedResults },
                },
              },
            },
          ];

          const result2 = await chatSession.sendMessage(functionResponseParts);
          const response2 = result2.response;
          return { response: response2.text() };
        }
      }

      return { response: response.text() };
    } catch (error) {
      this.logger.error('Error in chat:', error);
      return {
        response:
          "I'm having trouble connecting to the inventory right now. Please try again in a moment.",
      };
    }
  }
}
