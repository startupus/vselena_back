import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneAuthService } from './phone-auth.service';
import { PhoneAuthController } from './phone-auth.controller';
import { PhoneAuthMicroModule } from './phone-auth.micro-module';
import { User } from '../../../users/entities/user.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService, PhoneAuthMicroModule],
  exports: [PhoneAuthService, PhoneAuthMicroModule],
})
export class PhoneAuthModule {}
