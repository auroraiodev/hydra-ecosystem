import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import Jimp from 'jimp';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;
  private isLocalFallback = false;
  private localUploadsDir: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const endpoint = this.configService.get<string>('STORAGE_S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('STORAGE_S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('STORAGE_S3_SECRET_KEY');
    const region = this.configService.get<string>('STORAGE_S3_REGION', 'garage');
    this.bucket = this.configService.get<string>('STORAGE_S3_BUCKET', 'hydra-images');
    this.publicUrl = this.configService.get<string>('STORAGE_S3_PUBLIC_URL') || '';

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'Storage configuration is missing. Using local filesystem fallback for uploads.',
      );
      this.isLocalFallback = true;
      this.localUploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(this.localUploadsDir)) {
        fs.mkdirSync(this.localUploadsDir, { recursive: true });
      }
      return;
    }

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 5000,
        socketTimeout: 5000,
      }),
    });

    this.logger.log(`Storage service initialized. Bucket: ${this.bucket}, Region: ${region}`);
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{ url: string; key: string }> {
    try {
      this.logger.log(`Starting upload for file: ${file.originalname}`);

      const originalExtension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
      const isPng = originalExtension === 'png';
      
      const extension = isPng ? 'png' : 'jpg';
      const fileName = `${randomUUID()}.${extension}`;
      const key = `${folder}/${fileName}`;

      this.logger.debug(`Optimizing image: ${file.originalname} as ${extension}`);

      const image = await Jimp.read(file.buffer);
      
      const width = image.getWidth();
      const height = image.getHeight();
      if (width > 1200 || height > 1200) {
        image.scaleToFit(1200, 1200);
      }

      let optimizedBuffer: Buffer;
      if (isPng) {
        optimizedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
      } else {
        image.quality(80);
        optimizedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
      }

      if (this.isLocalFallback) {
        const targetDir = path.join(this.localUploadsDir, folder);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const filePath = path.join(targetDir, fileName);
        fs.writeFileSync(filePath, optimizedBuffer);
        const port = this.configService.get<string>('PORT') || '3013';
        const url = `http://127.0.0.1:${port}/uploads/${key}`;
        this.logger.log(`Local upload successful: ${url}`);
        return { url, key };
      }

      if (!this.s3Client) {
        throw new InternalServerErrorException(
          'Storage service is not configured. Check your environment variables.',
        );
      }

      this.logger.debug(`Uploading to S3 with key: ${key}`);
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: optimizedBuffer,
        ContentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      });

      await this.s3Client.send(command);

      const apiBase = this.configService.get<string>('API_URL') || 'http://localhost:3002';
      const url = `${apiBase}/api/v1/images/${key}`;

      this.logger.log(`Upload successful: ${url}`);
      return { url, key };
    } catch (error) {
      this.logger.error(
        `Error uploading image (${file.originalname}): ${error.stack || error.message}`,
      );
      throw error;
    }
  }

  async getObjectStream(key: string): Promise<Readable> {
    if (this.isLocalFallback) {
      const filePath = path.join(this.localUploadsDir, key);
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException(`File not found: ${filePath}`);
      }
      return fs.createReadStream(filePath);
    }

    if (!this.s3Client) {
      throw new InternalServerErrorException('Storage service is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    return response.Body as Readable;
  }

  async deleteImage(key: string): Promise<void> {
    try {
      if (this.isLocalFallback) {
        const filePath = path.join(this.localUploadsDir, key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          this.logger.log(`Local file deleted: ${filePath}`);
        }
        return;
      }

      if (!this.s3Client) {
        this.logger.warn('Storage service is not configured. Cannot delete image.');
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`S3 object deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete image (${key}): ${error.message || error}`);
    }
  }
}
