import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from '../common/storage/storage.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

function validatePathSegment(value: string, label: string): void {
  if (
    !value ||
    value.includes('..') ||
    value.includes('/') ||
    value.includes('\\') ||
    value.includes('\0')
  ) {
    throw new BadRequestException(`Invalid ${label}: path traversal detected`);
  }
}

@ApiTags('admin/upload')
@Controller('admin/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload an image to S3/Garage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Body('previousUrl') previousUrl?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Delete old image before uploading replacement
    if (previousUrl) {
      const oldKey = this.extractKeyFromUrl(previousUrl);
      if (oldKey) {
        await this.storageService.deleteImage(oldKey).catch(() => {
          // Ignore deletion errors — object may not exist
        });
      }
    }

    const result = await this.storageService.uploadImage(file);

    // Rewrite direct S3 URL to a proxy URL so objects stay private
    const host = req.get('host') || '127.0.0.1:3002';
    const protocol = req.protocol || 'http';
    const proxyUrl = `${protocol}://${host}/api/v1/images/${result.key}`;

    return {
      success: true,
      data: { url: proxyUrl, key: result.key },
    };
  }

  @Post('delete')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an image from S3/Garage by key' })
  async deleteImageByKey(@Body('key') key: string) {
    if (!key) {
      throw new BadRequestException('key is required');
    }
    await this.storageService.deleteImage(key);
    return {
      success: true,
      data: { key },
    };
  }

  @Delete('image/:folder/:filename')
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an image from S3/Garage' })
  async deleteImage(@Param('folder') folder: string, @Param('filename') filename: string) {
    validatePathSegment(folder, 'folder');
    validatePathSegment(filename, 'filename');
    const key = `${folder}/${filename}`;
    await this.storageService.deleteImage(key);
    return {
      success: true,
      data: { key },
    };
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      if (url.includes('/api/v1/images/')) {
        return url.split('/api/v1/images/').pop() || null;
      }
      if (url.includes('/uploads/')) {
        return url.split('/uploads/').pop() || null;
      }
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/^\//, '').replace(/^hydra\//, '');
    } catch {
      return null;
    }
  }
}
