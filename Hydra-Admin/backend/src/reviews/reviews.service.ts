import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    return this.prisma.reviews.create({
      data: {
        user_id: userId,
        ...createReviewDto,
      },
    });
  }

  async findAllApproved() {
    return this.prisma.reviews.findMany({
      where: { is_approved: true },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.reviews.findMany({
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        order: {
          select: { id: true, status: true, created_at: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async approve(id: string) {
    const review = await this.prisma.reviews.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.reviews.update({
      where: { id },
      data: { is_approved: true },
    });
  }

  async delete(id: string) {
    return this.prisma.reviews.delete({ where: { id } });
  }
}
