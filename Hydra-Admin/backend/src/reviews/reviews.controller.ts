import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { UserWithRole } from '../users/interfaces/user.interface.js';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all approved reviews for the home page' })
  @ApiResponse({ status: 200, description: 'List of approved reviews' })
  async getApprovedReviews() {
    return this.reviewsService.findAllApproved();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new review (Authenticated Users)' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  async createReview(@CurrentUser() user: UserWithRole, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(user.id, createReviewDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('admin')
  @ApiOperation({ summary: 'Get all reviews for moderation (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all reviews' })
  async getAdminReviews(@CurrentUser() user: UserWithRole) {
    if (user.role.name !== 'ADMIN') {
      throw new ForbiddenException('Only admins can moderate reviews');
    }
    return this.reviewsService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a review (Admin only)' })
  @ApiResponse({ status: 200, description: 'Review approved successfully' })
  async approveReview(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    if (user.role.name !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve reviews');
    }
    return this.reviewsService.approve(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review (Admin only)' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  async deleteReview(@Param('id') id: string, @CurrentUser() user: UserWithRole) {
    if (user.role.name !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete reviews');
    }
    await this.reviewsService.delete(id);
  }
}
