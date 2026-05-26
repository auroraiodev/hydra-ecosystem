import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ description: 'Message role', enum: ['user', 'model', 'system'], example: 'user' })
  @IsString()
  role: 'user' | 'model' | 'system';

  @ApiProperty({ description: 'Message content', example: 'What cards do you have in stock?' })
  @IsString()
  content: string;
}

export class AssistantChatDto {
  @ApiProperty({
    description: 'User message to the assistant',
    example: 'Show me rare Pokemon cards',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Conversation history for context',
    type: [ChatMessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  @IsOptional()
  history?: ChatMessageDto[];
}
