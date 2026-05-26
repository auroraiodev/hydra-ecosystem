import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { UserWithRole } from '../users/interfaces/user.interface.js';
import { WithdrawalRequestDto } from './dto/withdrawal-request.dto.js';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wallet balance and transaction history' })
  @ApiResponse({ status: 200, description: 'Wallet data retrieved successfully' })
  async getWallet(@CurrentUser() user: UserWithRole) {
    return this.walletService.getWalletData(user.id);
  }

  @Post('withdrawal')
  @ApiOperation({ summary: 'Request a balance withdrawal' })
  @ApiResponse({ status: 201, description: 'Withdrawal processed successfully' })
  async requestWithdrawal(@CurrentUser() user: UserWithRole, @Body() body: WithdrawalRequestDto) {
    return this.walletService.requestWithdrawal(user.id, body.amount, body.details);
  }
}
