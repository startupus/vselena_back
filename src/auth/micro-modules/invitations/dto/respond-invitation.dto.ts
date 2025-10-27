import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '../entities/invitation.entity';

export class RespondInvitationDto {
  @ApiProperty({ 
    description: 'Ответ на приглашение',
    enum: [InvitationStatus.ACCEPTED, InvitationStatus.DECLINED],
    example: InvitationStatus.ACCEPTED
  })
  @IsEnum([InvitationStatus.ACCEPTED, InvitationStatus.DECLINED], {
    message: 'Некорректный ответ на приглашение'
  })
  status: InvitationStatus.ACCEPTED | InvitationStatus.DECLINED;
}
