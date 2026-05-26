import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { Logger } from '@nestjs/common';
import { Public } from '@hydra/auth';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook/mercadopago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mercado Pago webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Invalid or missing signature' })
  async handleMercadoPagoWebhook(
    @Body() data: unknown,
    @Headers('x-signature') signature?: string,
    @Headers('x-request-id') requestId?: string,
    @Query() query?: Record<string, string>,
  ) {
    this.logger.log(`Received Mercado Pago webhook: ${requestId || 'no-request-id'}`);

    const secret = this.paymentsService.getWebhookSecret();

    if (!signature) {
      this.logger.warn(`Rejected webhook ${requestId}: missing x-signature header`);
      throw new UnauthorizedException('Missing webhook signature');
    }

    const isValid = this.paymentsService.verifyWebhookSignature(
      data,
      signature,
      requestId,
      secret,
      query ?? {},
    );

    if (!isValid) {
      this.logger.warn(`Rejected webhook ${requestId}: invalid signature`);
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`Webhook signature verified for request ${requestId}`);

    return this.paymentsService.processWebhook(data);
  }

  @Public()
  @Get('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public payment configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  async getConfig() {
    return this.paymentsService.getPublicConfig();
  }
}
