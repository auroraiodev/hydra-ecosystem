import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestoreDatabaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  backupFile: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  confirm: boolean;
}
