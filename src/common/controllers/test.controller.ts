import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('test')
export class TestController {
  @Get()
  @Public()
  getTest() {
    return { message: 'Test controller works!' };
  }
}
