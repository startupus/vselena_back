import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('test-invitations')
@Controller('test-invitations')
export class TestInvitationsController {
  @Get()
  testGet() {
    return { message: 'Test GET endpoint works' };
  }

  @Post('internal')
  testInternal() {
    return { message: 'Test internal endpoint works' };
  }
}
