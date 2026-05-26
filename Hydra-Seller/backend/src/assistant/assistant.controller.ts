import { Body, Controller, Post } from '@nestjs/common';
import { AssistantService } from './assistant.service.js';
import { AssistantChatDto } from './dto/assistant-chat.dto.js';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Assistant')
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with AI assistant',
    description:
      'Sends a message to the AI assistant (Gemini/Groq) and returns a response. ' +
      'Optionally includes conversation history for context.',
  })
  @ApiBody({ type: AssistantChatDto })
  @ApiResponse({
    status: 201,
    description: 'AI response returned.',
    schema: {
      type: 'object',
      properties: {
        response: { type: 'string', description: 'AI assistant reply' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input — validation failed.' })
  async chat(@Body() chatDto: AssistantChatDto) {
    return this.assistantService.chat(chatDto.message, chatDto.history);
  }
}
