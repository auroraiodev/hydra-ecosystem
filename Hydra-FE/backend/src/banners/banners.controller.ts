import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BannersService } from './banners.service.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Banners')
@Controller('banners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new banner (ADMIN only)' })
  create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannersService.create(createBannerDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all banners' })
  findAll() {
    return this.bannersService.findAll();
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get active banners' })
  @ApiQuery({ name: 'tcgId', required: false })
  findActive(@Query('tcgId') tcgId?: string) {
    return this.bannersService.findActive(tcgId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a banner (ADMIN only)' })
  update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
    return this.bannersService.update(id, updateBannerDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a banner (ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }
}
