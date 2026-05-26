import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { UserWithRole } from '../users/interfaces/user.interface.js';
import { VerifyWalletAccessDto } from './dto/verify-wallet-access.dto.js';
import { AdjustWalletBalanceDto } from './dto/adjust-wallet-balance.dto.js';
import { PayoutWalletBalanceDto } from './dto/payout-wallet-balance.dto.js';

@ApiTags('admin - wallet')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminWalletController {
  constructor(private readonly adminService: AdminService) {}

  @Get('wallet/users')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users with wallet balance' })
  async getWalletUsers() {
    return this.adminService.getUsersWallets();
  }

  @Get('wallet/users/:id')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a specific user wallet (balance + transactions)' })
  async getUserWallet(@Param('id') id: string) {
    return this.adminService.getUserWallet(id);
  }

  @Post('wallet/verify-access')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify wallet management access code' })
  async verifyWalletAccess(@Body() body: VerifyWalletAccessDto) {
    const valid = await this.adminService.verifyWalletAccessCode(body.code);
    if (!valid) throw new UnauthorizedException('Código incorrecto');
    return { ok: true };
  }

  @Post('wallet/users/:id/adjust')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually adjust a user wallet balance' })
  async adjustWalletBalance(
    @Param('id') id: string,
    @Body() body: AdjustWalletBalanceDto,
    @CurrentUser() user: UserWithRole,
  ) {
    if (user.id === id) {
      throw new ForbiddenException('No puedes ajustar tu propio saldo');
    }
    const valid = await this.adminService.verifyWalletAccessCode(body.code);
    if (!valid) throw new UnauthorizedException('Código incorrecto');
    return this.adminService.adjustWalletBalance(id, body.amount, body.description, body.isCredit);
  }

  @Post('wallet/users/:id/payout')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark a user wallet balance as paid (zeros it out)' })
  async payoutWalletBalance(
    @Param('id') id: string,
    @Body() body: PayoutWalletBalanceDto,
    @CurrentUser() user: UserWithRole,
  ) {
    if (user.id === id) {
      throw new ForbiddenException('No puedes pagar tu propio saldo');
    }
    const valid = await this.adminService.verifyWalletAccessCode(body.code);
    if (!valid) throw new UnauthorizedException('Código incorrecto');
    return this.adminService.payoutWalletBalance(id);
  }

  @Get('wallet/transactions')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all wallet transactions with filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by transaction type' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date' })
  async getWalletTransactions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filter: any = {};
    if (type) filter.type = type;
    if (userId) filter.userId = userId;
    if (dateFrom) filter.dateFrom = new Date(dateFrom);
    if (dateTo) filter.dateTo = new Date(dateTo);
    return this.adminService.getWalletTransactions(filter, page, limit);
  }
}
