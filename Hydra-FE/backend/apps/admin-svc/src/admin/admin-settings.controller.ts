import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard, RolesGuard, Roles } from '@hydra/auth';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

@ApiTags('admin - settings')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminSettingsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('settings')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all general settings' })
  @ApiResponse({ status: 200, description: 'General settings retrieved successfully' })
  async getSettings() {
    return this.adminService.getGeneralSettings();
  }

  @Post('settings')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update general settings' })
  @ApiBody({ type: UpdateSettingsDto })
  async updateSettings(@Body() settings: UpdateSettingsDto) {
    await this.adminService.updateGeneralSettings(settings);
    return { ok: true, message: 'Settings updated' };
  }
}
