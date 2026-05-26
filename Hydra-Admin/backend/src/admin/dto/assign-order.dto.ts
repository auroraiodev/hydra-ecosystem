import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignOrderDto {
  @ApiProperty({ description: 'Admin ID to assign' })
  @IsString()
  @IsNotEmpty()
  adminId: string;

  @ApiPropertyOptional({ description: 'Assignment notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
