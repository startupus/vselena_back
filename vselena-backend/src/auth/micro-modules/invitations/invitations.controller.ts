import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { InvitationType } from './entities/invitation.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('invitations')
@Controller('invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Post()
  @RequirePermissions('organizations.members', 'teams.members')
  @ApiOperation({ summary: 'Создать приглашение (с email)' })
  @ApiResponse({ status: 201, description: 'Приглашение создано', type: InvitationResponseDto })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  async createInvitation(
    @CurrentUser() user: any,
    @Body() dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    return this.invitationsService.createInvitation(user.userId, dto);
  }

  @Post('internal')
  @RequirePermissions('organizations.members', 'teams.members')
  @ApiOperation({ summary: 'Создать внутреннее приглашение (без email)' })
  @ApiResponse({ status: 201, description: 'Внутреннее приглашение создано', type: InvitationResponseDto })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  async createInternalInvitation(
    @CurrentUser() user: any,
    @Body() dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    return this.invitationsService.createInternalInvitation(user.userId, dto);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Принять приглашение' })
  @ApiResponse({ status: 200, description: 'Приглашение принято' })
  @ApiResponse({ status: 404, description: 'Приглашение не найдено' })
  @ApiResponse({ status: 400, description: 'Приглашение истекло или уже обработано' })
  async acceptInvitation(@Body() dto: AcceptInvitationDto): Promise<{ success: boolean; userId?: string }> {
    return this.invitationsService.acceptInvitation(dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Получить мои приглашения' })
  @ApiResponse({ status: 200, description: 'Список приглашений', type: [InvitationResponseDto] })
  async getMyInvitations(@CurrentUser() user: any): Promise<InvitationResponseDto[]> {
    return this.invitationsService.getUserInvitations(user.userId);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Получить отправленные приглашения' })
  @ApiResponse({ status: 200, description: 'Список отправленных приглашений', type: [InvitationResponseDto] })
  async getSentInvitations(@CurrentUser() user: any): Promise<InvitationResponseDto[]> {
    return this.invitationsService.getSentInvitations(user.userId);
  }

  @Get('entity/:type/:id')
  @ApiOperation({ summary: 'Получить приглашения команды/организации' })
  @ApiResponse({ status: 200, description: 'Список приглашений', type: [InvitationResponseDto] })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async getInvitationsForEntity(
    @CurrentUser() user: any,
    @Param('type') type: 'team' | 'organization',
    @Param('id') entityId: string,
  ): Promise<InvitationResponseDto[]> {
    const invitationType = type === 'team' ? InvitationType.TEAM : InvitationType.ORGANIZATION;
    return this.invitationsService.getInvitationsForEntity(user.userId, invitationType, entityId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Отменить приглашение' })
  @ApiResponse({ status: 200, description: 'Приглашение отменено' })
  @ApiResponse({ status: 404, description: 'Приглашение не найдено' })
  @ApiResponse({ status: 400, description: 'Нельзя отменить обработанное приглашение' })
  async cancelInvitation(
    @CurrentUser() user: any,
    @Param('id') invitationId: string,
  ): Promise<{ message: string }> {
    await this.invitationsService.cancelInvitation(user.userId, invitationId);
    return { message: 'Приглашение успешно отменено' };
  }

  @Post('accept-notification/:id')
  @ApiOperation({ summary: 'Принять приглашение через уведомление' })
  @ApiResponse({ status: 200, description: 'Приглашение принято' })
  @ApiResponse({ status: 404, description: 'Приглашение не найдено' })
  @ApiResponse({ status: 400, description: 'Приглашение истекло или уже обработано' })
  async acceptInvitationFromNotification(
    @CurrentUser() user: any,
    @Param('id') invitationId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.invitationsService.acceptInvitationFromNotification(user.userId, invitationId);
  }

  @Post('decline-notification/:id')
  @ApiOperation({ summary: 'Отклонить приглашение через уведомление' })
  @ApiResponse({ status: 200, description: 'Приглашение отклонено' })
  @ApiResponse({ status: 404, description: 'Приглашение не найдено' })
  @ApiResponse({ status: 400, description: 'Приглашение уже обработано' })
  async declineInvitationFromNotification(
    @CurrentUser() user: any,
    @Param('id') invitationId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.invitationsService.declineInvitationFromNotification(user.userId, invitationId);
  }
}