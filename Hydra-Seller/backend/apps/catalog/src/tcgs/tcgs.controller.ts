import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TcgsService } from './tcgs.service.js';
import { CreateTcgDto } from './dto/create-tcg.dto.js';
import { UpdateTcgDto } from './dto/update-tcg.dto.js';
import { JwtAuthGuard } from '@hydra/auth';
import { RolesGuard } from '@hydra/auth';
import { Roles } from '@hydra/auth';
import { Public } from '@hydra/auth';

@ApiTags('tcgs')
@Controller('tcgs')
export class TcgsController {
  constructor(private readonly tcgsService: TcgsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new TCG (ADMIN and SELLER only)' })
  @ApiBody({ type: CreateTcgDto })
  @ApiResponse({
    status: 201,
    description: 'TCG successfully created',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Seller role required',
  })
  @ApiResponse({
    status: 409,
    description: 'TCG with this name already exists',
  })
  create(@Body() createTcgDto: CreateTcgDto) {
    return this.tcgsService.create(createTcgDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all TCGs' })
  @ApiResponse({
    status: 200,
    description: 'List of all TCGs',
  })
  findAll() {
    return this.tcgsService.findAll();
  }

  @Get('active')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get all active TCGs' })
  @ApiResponse({
    status: 200,
    description: 'List of active TCGs',
  })
  findActive() {
    return this.tcgsService.findActive();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a TCG by ID' })
  @ApiParam({ name: 'id', description: 'TCG ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'TCG found',
  })
  @ApiResponse({
    status: 404,
    description: 'TCG not found',
  })
  findOne(@Param('id') id: string) {
    return this.tcgsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a TCG (ADMIN and SELLER only)' })
  @ApiParam({ name: 'id', description: 'TCG ID (UUID)' })
  @ApiBody({ type: UpdateTcgDto })
  @ApiResponse({
    status: 200,
    description: 'TCG updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Seller role required',
  })
  @ApiResponse({
    status: 404,
    description: 'TCG not found',
  })
  update(@Param('id') id: string, @Body() updateTcgDto: UpdateTcgDto) {
    return this.tcgsService.update(id, updateTcgDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a TCG (ADMIN and SELLER only)' })
  @ApiParam({ name: 'id', description: 'TCG ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'TCG deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Seller role required',
  })
  @ApiResponse({
    status: 404,
    description: 'TCG not found or has associated singles',
  })
  remove(@Param('id') id: string) {
    return this.tcgsService.remove(id);
  }
}
