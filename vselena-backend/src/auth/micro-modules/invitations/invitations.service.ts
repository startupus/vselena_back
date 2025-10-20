import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Invitation, InvitationStatus, InvitationType } from './entities/invitation.entity';
import { User } from '../../../users/entities/user.entity';
import { Team } from '../../../teams/entities/team.entity';
import { Organization } from '../../../organizations/entities/organization.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { EmailService } from '../../email.service';
import { UsersService } from '../../../users/users.service';
import { RbacService } from '../../../rbac/rbac.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { NotificationType } from '../../../notifications/entities/notification.entity';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepo: Repository<Invitation>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
    @InjectRepository(Organization)
    private organizationsRepo: Repository<Organization>,
    private configService: ConfigService,
    private emailService: EmailService,
    private usersService: UsersService,
    private rbacService: RbacService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Создание приглашения
   */
  async createInvitation(
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    // Проверяем права пользователя
    const canInvite = await this.checkInvitationPermissions(invitedById, dto.type, dto.organizationId, dto.teamId);
    if (!canInvite) {
      throw new ForbiddenException('Недостаточно прав для создания приглашений');
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.usersRepo.findOne({ where: { email: dto.email } });

    // Если пользователь уже существует, добавляем его в организацию/команду
    if (existingUser) {
      // Проверяем, не является ли пользователь уже членом
      if (dto.type === InvitationType.ORGANIZATION && existingUser.organizationId === dto.organizationId) {
        throw new BadRequestException('Пользователь уже является членом этой организации');
      }
      if (dto.type === InvitationType.TEAM && existingUser.teamId === dto.teamId) {
        throw new BadRequestException('Пользователь уже является членом этой команды');
      }

      // Генерируем токен для уведомления
      const token = crypto.randomBytes(32).toString('hex');
      const expiresInDays = dto.expiresInDays || 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Создаем приглашение
      const invitation = this.invitationsRepo.create({
        email: dto.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        type: dto.type,
        organizationId: dto.organizationId,
        teamId: dto.teamId,
        roleId: dto.roleId,
        invitedById,
        token,
        expiresAt,
        status: InvitationStatus.PENDING,
      });

      await this.invitationsRepo.save(invitation);

      // Отправляем уведомление существующему пользователю
      await this.notificationsService.createNotification(
        existingUser.id,
        NotificationType.INVITATION,
        dto.type === InvitationType.ORGANIZATION 
          ? 'Приглашение в организацию' 
          : 'Приглашение в команду',
        `Вы приглашены в ${dto.type === InvitationType.ORGANIZATION ? 'организацию' : 'команду'}. Примите или отклоните приглашение.`,
        { invitationId: invitation.id }
      );

      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const invitationLink = `${frontendUrl}/dashboard?invitation=${token}`;

      return {
        id: invitation.id,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        type: invitation.type,
        organizationId: invitation.organizationId,
        teamId: invitation.teamId,
        status: invitation.status,
        roleId: invitation.roleId,
        invitedById: invitation.invitedById,
        acceptedById: invitation.acceptedById,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
        invitationLink,
      };
    }

    // Если пользователя нет, создаем приглашение на регистрацию
    // Проверяем, не существует ли уже активное приглашение
    const existingInvitation = await this.invitationsRepo.findOne({
      where: {
        email: dto.email,
        status: InvitationStatus.PENDING,
      },
    });
    if (existingInvitation) {
      throw new BadRequestException('Приглашение для этого email уже отправлено');
    }

    // Генерируем токен
    const token = crypto.randomBytes(32).toString('hex');

    // Вычисляем дату истечения
    const expiresInDays = dto.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Создаем приглашение
    const invitation = this.invitationsRepo.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      type: dto.type,
      organizationId: dto.organizationId,
      teamId: dto.teamId,
      roleId: dto.roleId,
      invitedById,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    await this.invitationsRepo.save(invitation);

    // Отправляем email для регистрации
    await this.sendInvitationEmail(invitation);

    // Формируем ссылку для приглашения
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const invitationLink = `${frontendUrl}/register?invite=${token}`;

    return {
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      type: invitation.type,
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
      status: invitation.status,
      roleId: invitation.roleId,
      invitedById: invitation.invitedById,
      acceptedById: invitation.acceptedById,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      invitationLink,
    };
  }

  /**
   * Принятие приглашения
   */
  async acceptInvitation(dto: AcceptInvitationDto): Promise<{ success: boolean; userId?: string }> {
    const invitation = await this.invitationsRepo.findOne({
      where: { token: dto.token },
      relations: ['invitedBy'],
    });

    if (!invitation) {
      throw new NotFoundException('Приглашение не найдено');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Приглашение уже обработано');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationsRepo.save(invitation);
      throw new BadRequestException('Приглашение истекло');
    }

    // Создаем пользователя
    const user = await this.usersService.create({
      email: invitation.email,
      firstName: dto.firstName || invitation.firstName || 'Пользователь',
      lastName: dto.lastName || invitation.lastName || 'Пользователь',
      passwordHash: dto.password ? await this.hashPassword(dto.password) : null,
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
    });

    // При приглашении существующего пользователя роль НЕ меняется
    // Пользователь остается со своей текущей ролью
    // Только добавляется связь с командой/организацией

    // Обновляем приглашение
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedById = user.id;
    invitation.acceptedAt = new Date();
    await this.invitationsRepo.save(invitation);

    console.log(`✅ Пользователь ${user.email} принял приглашение от ${invitation.invitedBy.email}`);

    return { success: true, userId: user.id };
  }

  /**
   * Получение приглашений пользователя (приглашения, адресованные ему)
   */
  async getUserInvitations(userId: string): Promise<InvitationResponseDto[]> {
    // Получаем email пользователя
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      return [];
    }

    // Ищем приглашения по email пользователя с JOIN'ами для загрузки связанных данных
    const invitations = await this.invitationsRepo
      .createQueryBuilder('invitation')
      .leftJoinAndSelect('invitation.organization', 'organization')
      .leftJoinAndSelect('invitation.team', 'team')
      .leftJoinAndSelect('invitation.invitedBy', 'invitedBy')
      .where('invitation.email = :email', { email: user.email })
      .orderBy('invitation.createdAt', 'DESC')
      .getMany();

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    return invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      type: invitation.type,
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
      status: invitation.status,
      roleId: invitation.roleId,
      invitedById: invitation.invitedById,
      acceptedById: invitation.acceptedById,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      invitationLink: `${frontendUrl}/dashboard?invitation=${invitation.token}`,
      // Добавляем данные о команде/организации и приглашающем
      targetName: invitation.type === 'team' ? invitation.team?.name : invitation.organization?.name,
      inviterName: invitation.invitedBy ? `${invitation.invitedBy.firstName || ''} ${invitation.invitedBy.lastName || ''}`.trim() : null,
      inviterEmail: invitation.invitedBy?.email || null,
    }));
  }

  /**
   * Отмена приглашения
   */
  async cancelInvitation(userId: string, invitationId: string): Promise<void> {
    // Сначала ищем приглашение
    const invitation = await this.invitationsRepo.findOne({
      where: { id: invitationId },
      relations: ['organization', 'team'],
    });

    if (!invitation) {
      throw new NotFoundException('Приглашение не найдено');
    }

    if (invitation.status === InvitationStatus.DECLINED || invitation.status === InvitationStatus.EXPIRED) {
      throw new BadRequestException('Нельзя отменить отклоненное или истекшее приглашение');
    }

    // Проверяем права на отмену приглашения
    const canCancel = await this.checkCancelInvitationPermissions(userId, invitation);
    if (!canCancel) {
      throw new ForbiddenException('Недостаточно прав для отмены приглашения');
    }

    // Если приглашение было принято, нужно удалить пользователя из команды/организации
    if (invitation.status === InvitationStatus.ACCEPTED && invitation.acceptedById) {
      const acceptedUser = await this.usersRepo.findOne({
        where: { id: invitation.acceptedById },
        relations: ['teams'],
      });

      if (acceptedUser) {
        // Удаляем пользователя из команды, если приглашение было в команду
        if (invitation.type === InvitationType.TEAM && invitation.teamId) {
          await this.usersRepo
            .createQueryBuilder()
            .relation(User, 'teams')
            .of(acceptedUser.id)
            .remove(invitation.teamId);
        }

        // Сбрасываем teamId и organizationId пользователя
        acceptedUser.teamId = null;
        acceptedUser.organizationId = null;
        await this.usersRepo.save(acceptedUser);
      }
    }

    // Удаляем приглашение из базы данных
    await this.invitationsRepo.remove(invitation);
  }

  /**
   * Проверка прав на отмену приглашения
   */
  private async checkCancelInvitationPermissions(userId: string, invitation: Invitation): Promise<boolean> {
    // Может отменить тот, кто отправил приглашение
    if (invitation.invitedById === userId) {
      return true;
    }

    // Или админ организации/команды
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'organization', 'team'],
    });

    if (!user) return false;

    // Проверяем права в зависимости от типа приглашения
    if (invitation.type === InvitationType.ORGANIZATION && invitation.organizationId) {
      const isOrgAdmin = user.organizationId === invitation.organizationId;
      const hasPermission = user.roles.some(role =>
        role.permissions.some(perm => perm.name === 'organizations.members')
      );
      
      return isOrgAdmin || hasPermission;
    }

    if (invitation.type === InvitationType.TEAM && invitation.teamId) {
      const isTeamAdmin = user.teamId === invitation.teamId;
      const hasPermission = user.roles.some(role =>
        role.permissions.some(perm => perm.name === 'teams.members')
      );
      
      return isTeamAdmin || hasPermission;
    }

    return false;
  }

  /**
   * Получение отправленных приглашений (приглашения, отправленные текущим пользователем)
   */
  async getSentInvitations(userId: string): Promise<InvitationResponseDto[]> {
    // Ищем приглашения, отправленные текущим пользователем с JOIN'ами для загрузки связанных данных
    const invitations = await this.invitationsRepo
      .createQueryBuilder('invitation')
      .leftJoinAndSelect('invitation.organization', 'organization')
      .leftJoinAndSelect('invitation.team', 'team')
      .leftJoinAndSelect('invitation.invitedBy', 'invitedBy')
      .where('invitation.invitedById = :userId', { userId })
      .orderBy('invitation.createdAt', 'DESC')
      .getMany();

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    return invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      type: invitation.type,
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
      status: invitation.status,
      roleId: invitation.roleId,
      invitedById: invitation.invitedById,
      acceptedById: invitation.acceptedById,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      invitationLink: `${frontendUrl}/dashboard?invitation=${invitation.token}`,
      // Добавляем данные о команде/организации и приглашающем
      targetName: invitation.type === 'team' ? invitation.team?.name : invitation.organization?.name,
      inviterName: invitation.invitedBy ? `${invitation.invitedBy.firstName || ''} ${invitation.invitedBy.lastName || ''}`.trim() : null,
      inviterEmail: invitation.invitedBy?.email || null,
    }));
  }

  /**
   * Проверка прав на создание приглашений
   */
  private async checkInvitationPermissions(
    userId: string,
    type: InvitationType,
    organizationId?: string,
    teamId?: string,
  ): Promise<boolean> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'organization', 'team'],
    });

    if (!user) return false;

    // Проверяем права в зависимости от типа приглашения
    if (type === InvitationType.ORGANIZATION && organizationId) {
      // Проверяем, является ли пользователь создателем организации или имеет права
      const isOrgCreator = user.organizationId === organizationId;
      const hasPermission = user.roles.some(role =>
        role.permissions.some(perm => perm.name === 'organizations.members')
      );
      
      return isOrgCreator || hasPermission;
    }

    if (type === InvitationType.TEAM && teamId) {
      // Проверяем, является ли пользователь создателем команды или имеет права
      const isTeamCreator = user.teamId === teamId;
      const hasPermission = user.roles.some(role =>
        role.permissions.some(perm => perm.name === 'teams.members')
      );
      
      return isTeamCreator || hasPermission;
    }

    return false;
  }

  /**
   * Отправка email с приглашением
   */
  private async sendInvitationEmail(invitation: Invitation): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const invitationLink = `${frontendUrl}/register?invite=${invitation.token}`;

    const subject = 'Приглашение в систему Vselena';
    const html = `
      <h2>Приглашение в систему Vselena</h2>
      <p>Вы приглашены в систему управления базой знаний Vselena.</p>
      <p>Для завершения регистрации перейдите по ссылке:</p>
      <p><a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Принять приглашение</a></p>
      <p>Ссылка действительна до: ${invitation.expiresAt?.toLocaleDateString('ru-RU')}</p>
      <p>Если кнопка не работает, скопируйте ссылку: ${invitationLink}</p>
    `;

    await this.emailService.sendEmail({
      to: invitation.email,
      subject,
      html,
    });
  }

  /**
   * Создание внутреннего приглашения (без email)
   */
  async createInternalInvitation(
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    // Проверяем права пользователя
    const canInvite = await this.checkInvitationPermissions(invitedById, dto.type, dto.organizationId, dto.teamId);
    if (!canInvite) {
      throw new ForbiddenException('Недостаточно прав для создания приглашений');
    }

    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existingUser) {
      // Если пользователь существует, создаем реальное приглашение в БД напрямую
      const invitation = await this.createInvitationForExistingUser(invitedById, dto);
      
      // Создаем уведомление с реальным ID приглашения
      await this.createInvitationNotification(existingUser.id, invitedById, dto, invitation.id);
      
      return invitation;
    }

    // Проверяем, не существует ли уже активное приглашение
    const existingInvitation = await this.invitationsRepo.findOne({
      where: {
        email: dto.email,
        status: InvitationStatus.PENDING,
      },
    });
    if (existingInvitation) {
      throw new BadRequestException('Приглашение для этого email уже отправлено');
    }

    // Генерируем токен
    const token = crypto.randomBytes(32).toString('hex');

    // Вычисляем дату истечения
    const expiresInDays = dto.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Создаем приглашение
    const invitation = this.invitationsRepo.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      type: dto.type,
      organizationId: dto.organizationId,
      teamId: dto.teamId,
      roleId: dto.roleId,
      invitedById,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    await this.invitationsRepo.save(invitation);

    // Уведомления для существующих пользователей создаются в createInternalInvitation

    // Формируем ссылку для приглашения
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const invitationLink = `${frontendUrl}/register?invite=${token}`;

    return {
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      type: invitation.type,
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
      status: invitation.status,
      roleId: invitation.roleId,
      invitedById: invitation.invitedById,
      acceptedById: invitation.acceptedById,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      invitationLink,
    };
  }

  /**
   * Получение приглашений для команды/организации
   */
  async getInvitationsForEntity(
    userId: string,
    type: InvitationType,
    entityId: string,
  ): Promise<InvitationResponseDto[]> {
    // Проверяем права пользователя
    const canView = await this.checkInvitationPermissions(userId, type, 
      type === InvitationType.ORGANIZATION ? entityId : undefined,
      type === InvitationType.TEAM ? entityId : undefined
    );
    
    if (!canView) {
      throw new ForbiddenException('Недостаточно прав для просмотра приглашений');
    }

    const whereCondition = type === InvitationType.ORGANIZATION 
      ? { organizationId: entityId }
      : { teamId: entityId };

    const invitations = await this.invitationsRepo.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    return invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      type: invitation.type,
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
      status: invitation.status,
      roleId: invitation.roleId,
      invitedById: invitation.invitedById,
      acceptedById: invitation.acceptedById,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      invitationLink: `${frontendUrl}/register?invite=${invitation.token}`,
    }));
  }

  /**
   * Хеширование пароля
   */
  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Принятие приглашения через уведомление
   */
  async acceptInvitationFromNotification(
    userId: string,
    invitationId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Находим приглашение по ID
    const invitation = await this.invitationsRepo.findOne({
      where: { id: invitationId },
      relations: ['invitedBy'],
    });

    if (!invitation) {
      throw new NotFoundException('Приглашение не найдено');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Приглашение уже обработано');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationsRepo.save(invitation);
      throw new BadRequestException('Приглашение истекло');
    }

    // Получаем пользователя
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Обновляем данные пользователя
    const updateData: any = {};
    
    if (invitation.organizationId) {
      updateData.organizationId = invitation.organizationId;
      // Проверяем, не добавлен ли уже пользователь в организацию
      const existingOrgRelation = await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'organizations')
        .of(user.id)
        .loadMany();
      
      const isAlreadyInOrg = existingOrgRelation.some(org => org.id === invitation.organizationId);
      if (!isAlreadyInOrg) {
        // Добавляем связь в таблицу user_organizations
        await this.usersRepo
          .createQueryBuilder()
          .relation(User, 'organizations')
          .of(user.id)
          .add(invitation.organizationId);
      }
    }
    
    if (invitation.teamId) {
      updateData.teamId = invitation.teamId;
      // Проверяем, не добавлен ли уже пользователь в команду
      const existingTeamRelation = await this.usersRepo
        .createQueryBuilder()
        .relation(User, 'teams')
        .of(user.id)
        .loadMany();
      
      const isAlreadyInTeam = existingTeamRelation.some(team => team.id === invitation.teamId);
      if (!isAlreadyInTeam) {
        // Добавляем связь в таблицу user_teams
        await this.usersRepo
          .createQueryBuilder()
          .relation(User, 'teams')
          .of(user.id)
          .add(invitation.teamId);
      }
    }
    
    // Сохраняем изменения в пользователе (используем update для гарантии)
    if (Object.keys(updateData).length > 0) {
      await this.usersRepo.update(user.id, updateData);
    }

    // При приглашении существующего пользователя роль НЕ меняется
    // Пользователь остается со своей текущей ролью
    // Только добавляется связь с командой/организацией

    // Обновляем приглашение
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedById = user.id;
    invitation.acceptedAt = new Date();
    await this.invitationsRepo.save(invitation);

    // Создаем уведомление для администратора о том, что приглашение принято
    await this.notificationsService.createNotification(
      invitation.invitedById,
      NotificationType.INVITATION,
      'Приглашение принято',
      `Пользователь ${user.email} принял ваше приглашение в ${invitation.type === InvitationType.TEAM ? 'команду' : 'организацию'}`,
      {
        invitationId: invitation.id,
        acceptedBy: user.email,
        type: invitation.type === InvitationType.TEAM ? 'team' : 'organization',
        status: 'accepted'
      }
    );

    // Создаем уведомление для принявшего пользователя о том, что он присоединился
    await this.notificationsService.createNotification(
      user.id,
      NotificationType.INVITATION,
      'Приглашение принято',
      `Вы успешно присоединились к ${invitation.type === InvitationType.TEAM ? 'команде' : 'организации'}`,
      {
        invitationId: invitation.id,
        type: invitation.type === InvitationType.TEAM ? 'team' : 'organization',
        status: 'accepted'
      }
    );

    console.log(`✅ Пользователь ${user.email} принял приглашение от ${invitation.invitedBy.email}`);

    return { 
      success: true, 
      message: `Вы успешно присоединились к ${invitation.type === InvitationType.TEAM ? 'команде' : 'организации'}` 
    };
  }

  /**
   * Отклонение приглашения через уведомление
   */
  async declineInvitationFromNotification(
    userId: string,
    invitationId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Находим приглашение по ID
    const invitation = await this.invitationsRepo.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Приглашение не найдено');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Приглашение уже обработано');
    }

    // Получаем пользователя для уведомления администратора
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    
    // Обновляем приглашение
    invitation.status = InvitationStatus.DECLINED;
    invitation.acceptedById = userId;
    invitation.acceptedAt = new Date();
    await this.invitationsRepo.save(invitation);

    // Создаем уведомление для администратора о том, что приглашение отклонено
    if (user) {
      await this.notificationsService.createNotification(
        invitation.invitedById,
        NotificationType.INVITATION,
        'Приглашение отклонено',
        `Пользователь ${user.email} отклонил ваше приглашение в ${invitation.type === InvitationType.TEAM ? 'команду' : 'организацию'}`,
        {
          invitationId: invitation.id,
          declinedBy: user.email,
          type: invitation.type === InvitationType.TEAM ? 'team' : 'organization',
          status: 'declined'
        }
      );

      // Создаем уведомление для отклонившего пользователя
      await this.notificationsService.createNotification(
        user.id,
        NotificationType.INVITATION,
        'Приглашение отклонено',
        `Вы отклонили приглашение в ${invitation.type === InvitationType.TEAM ? 'команду' : 'организацию'}`,
        {
          invitationId: invitation.id,
          type: invitation.type === InvitationType.TEAM ? 'team' : 'organization',
          status: 'declined'
        }
      );
    }

    console.log(`❌ Пользователь отклонил приглашение ${invitationId}`);

    return { 
      success: true, 
      message: 'Приглашение отклонено' 
    };
  }

  /**
   * Обновление статуса приглашения
   */
  async updateInvitationStatus(
    invitationId: string,
    status: InvitationStatus,
    acceptedById?: string,
  ): Promise<void> {
    const invitation = await this.invitationsRepo.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Приглашение не найдено');
    }

    invitation.status = status;
    if (acceptedById) {
      invitation.acceptedById = acceptedById;
      invitation.acceptedAt = new Date();
    }
    
    await this.invitationsRepo.save(invitation);
  }

  /**
   * Создание приглашения для существующего пользователя (без проверки на существование)
   */
  private async createInvitationForExistingUser(
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    // Проверяем, не существует ли уже активное приглашение
    const existingInvitation = await this.invitationsRepo.findOne({
      where: {
        email: dto.email,
        status: InvitationStatus.PENDING,
      },
    });
    if (existingInvitation) {
      throw new BadRequestException('Приглашение для этого email уже отправлено');
    }

    // Генерируем токен
    const token = crypto.randomBytes(32).toString('hex');

    // Вычисляем дату истечения
    const expiresInDays = dto.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Создаем приглашение
    const invitation = this.invitationsRepo.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      type: dto.type,
      organizationId: dto.organizationId,
      teamId: dto.teamId,
      roleId: dto.roleId,
      invitedById,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    await this.invitationsRepo.save(invitation);

    // Формируем ссылку для приглашения
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const invitationLink = `${frontendUrl}/register?invite=${token}`;

    return {
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      type: invitation.type,
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
      status: invitation.status,
      roleId: invitation.roleId,
      invitedById: invitation.invitedById,
      acceptedById: invitation.acceptedById,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      invitationLink,
    };
  }

  /**
   * Создание уведомления о приглашении для существующего пользователя
   */
  private async createInvitationNotification(
    userId: string,
    invitedById: string,
    dto: CreateInvitationDto,
    invitationId?: string,
  ): Promise<void> {
    // Проверяем, не существует ли уже активное уведомление для этого пользователя
    const existingNotifications = await this.notificationsService.getUserNotifications(userId);
    const hasActiveInvitation = existingNotifications.some(notification => 
      notification.type === NotificationType.INVITATION && 
      notification.data?.type === (dto.type === InvitationType.TEAM ? 'team' : 'organization') &&
      !notification.isRead
    );

    if (hasActiveInvitation) {
      console.log('У пользователя уже есть активное уведомление о приглашении, пропускаем создание дубликата');
      return;
    }

    // Получаем информацию о приглашающем
    const inviter = await this.usersRepo.findOne({ where: { id: invitedById } });
    const inviterName = inviter ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || inviter.email : 'Неизвестный';

    // Получаем информацию о команде/организации
    let teamName: string | undefined;
    let organizationName: string | undefined;

    if (dto.type === InvitationType.TEAM && dto.teamId) {
      // Получаем название команды из базы данных
      const team = await this.teamsRepo.findOne({ where: { id: dto.teamId } });
      teamName = team?.name || 'Команда';
    }

    if (dto.type === InvitationType.ORGANIZATION && dto.organizationId) {
      // Получаем название организации из базы данных
      const organization = await this.organizationsRepo.findOne({ where: { id: dto.organizationId } });
      organizationName = organization?.name || 'Организация';
    }

    // Создаем уведомление
    await this.notificationsService.createInvitationNotification(userId, {
      invitationId: invitationId || 'internal-invitation', // ID приглашения или заглушка для внутренних
      inviterName,
      teamName,
      organizationName,
      type: dto.type === InvitationType.TEAM ? 'team' : 'organization',
    });
  }
}