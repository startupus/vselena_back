import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { ReferralMicroModule } from './referral.micro-module';
import { Referral } from './entities/referral.entity';
import { User } from '../../../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Referral, User]),
  ],
  controllers: [ReferralController],
  providers: [ReferralService, ReferralMicroModule],
  exports: [ReferralService, ReferralMicroModule],
})
export class ReferralModule {}
