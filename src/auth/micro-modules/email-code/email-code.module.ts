import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailCodeController } from './email-code.controller';
import { EmailCodeService } from './email-code.service';
import { User } from '../../../users/entities/user.entity';
import { EmailService } from '../../email.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule,
    ConfigModule,
  ],
  controllers: [EmailCodeController],
  providers: [EmailCodeService, EmailService],
  exports: [EmailCodeService],
})
export class EmailCodeModule {}
