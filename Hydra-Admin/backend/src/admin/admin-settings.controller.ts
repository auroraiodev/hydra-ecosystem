import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
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
    const keys = Object.keys(settings);
    console.log(`[AdminSettings] POST received. Keys (${keys.length}):`, keys);
    console.log('[AdminSettings] Body:', JSON.stringify(settings));
    await this.adminService.updateGeneralSettings(settings);
    return { ok: true, message: 'Settings updated', received: keys.length };
  }
}
