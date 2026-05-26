import { Controller, Get, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModalService } from './modal.service.js';
import { JwtAuthGuard, CurrentUser } from '@hydra/auth';
import type { UserWithRole } from '@hydra/auth';

@ApiTags('modal')
@Controller('modal')
export class ModalController {
  constructor(private readonly modalService: ModalService) {}

  @Get('seen')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if user has seen the modal' })
  @ApiResponse({
    status: 200,
    description: 'Returns whether user has seen the modal',
    schema: {
      properties: {
        seen: { type: 'boolean' },
      },
    },
  })
  async hasSeen(@CurrentUser() user: UserWithRole) {
    const seen = await this.modalService.hasSeen(user.id);
    return { seen };
  }

  @Post('mark-seen')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark modal as seen for current user' })
  @ApiResponse({
    status: 200,
    description: 'Modal marked as seen',
  })
  async markAsSeen(@CurrentUser() user: UserWithRole) {
    await this.modalService.markAsSeen(user.id);
    return { success: true };
  }
}
