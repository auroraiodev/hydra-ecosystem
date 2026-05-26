import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BroadcastNotificationDto {
  @ApiPropertyOptional({ description: 'Target user ID (omit to notify all admins)' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
