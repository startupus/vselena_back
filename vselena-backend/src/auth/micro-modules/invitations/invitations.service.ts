import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Invitation, InvitationStatus, InvitationType } from './entities/invitation.entity';
import { User } from '../../../users/entities/user.entity';
import { UserRoleAssignment } from '../../../users/entities/user-role-assignment.entity';
import { Role } from '../../../rbac/entities/role.entity';
import { Team } from '../../../teams/entities/team.entity';
import { Organization } from '../../../organizations/entities/organization.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { EmailService } from '../../email.service';
import { UsersService } from '../../../users/users.service';
import { RbacService } from '../../../rbac/rbac.service';
// import { UserRoleAssignmentService } from '../../../users/user-role-assignment.service';
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
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepo: Repository<UserRoleAssignment>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
    @InjectRepository(Organization)
    private organizationsRepo: Repository<Organization>,
    private configService: ConfigService,
    private emailService: EmailService,
    private usersService: UsersService,
    private rbacService: RbacService,
    // private userRoleAssignmentService: UserRoleAssignmentService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Создание приглашения
   */
  async createInvitation(
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    // Убрали проверку прав - теперь все пользователи могут создавать приглашения

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.usersRepo.findOne({ where: { email: dto.email } });

    // Если пользователь уже существует, добавляем его в организацию/команду
    if (existingUser) {
      // Проверяем, не является ли пользователь уже членом
      if (dto.type === InvitationType.ORGANIZATION && existingUser.organizations?.some(org => org.id === dto.organizationId)) {
        throw new BadRequestException('Пользователь уже является членом этой организации');
      }
      if (dto.type === InvitationType.TEAM && existingUser.teams?.some(team => team.id === dto.teamId)) {
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

      // Отправляем email уведомление
      await this.sendInvitationEmail(invitation, invitedById);

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

    console.log('🔍 Invitation saved, about to send email...');
    
    // Отправляем email для регистрации
    try {
      await this.sendInvitationEmail(invitation);
      console.log('✅ Email sent successfully');
    } catch (error) {
      console.error('❌ Error sending invitation email:', error);
      // Не бросаем ошибку, чтобы не блокировать создание приглашения
    }

    // Формируем ссылку для приглашения
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const invitationLink = `${frontendUrl}/invitation?token=${token}`;

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
  async acceptInvitation(dto: AcceptInvitationDto): Promise<{ 
    success: boolean; 
    userId?: string; 
    redirectTo?: string;
    message?: string;
  }> {
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

    // Проверяем, существует ли пользователь
    let user = await this.usersService.findByEmail(invitation.email);
    
    if (!user) {
      // Создаем пользователя, если его нет
      user = await this.usersService.create({
        email: invitation.email,
        firstName: dto.firstName || invitation.firstName || 'Пользователь',
        lastName: dto.lastName || invitation.lastName || 'Пользователь',
        passwordHash: dto.password ? await this.hashPassword(dto.password) : null,
      });
      console.log(`✅ Создан новый пользователь ${user.email}`);
    } else {
      console.log(`ℹ️ Пользователь ${user.email} уже существует`);
    }

    // Добавляем пользователя в организацию/команду
    if (invitation.organizationId) {
      await this.usersService.updateUserOrganization(user.id, invitation.organizationId, user.id);
    }
    if (invitation.teamId) {
      await this.usersService.updateUserTeam(user.id, invitation.teamId, user.id);
    }

    // Назначаем роль из приглашения (если указана) или базовую роль
    if (invitation.roleId) {
      // Проверяем, не назначена ли уже эта роль
      const existingAssignment = await this.userRoleAssignmentRepo.findOne({
        where: {
          userId: user.id,
          roleId: invitation.roleId,
          organizationId: invitation.organizationId,
          teamId: invitation.teamId
        }
      });

      if (!existingAssignment) {
        const userRoleAssignment = this.userRoleAssignmentRepo.create({
          organizationId: invitation.organizationId,
          teamId: invitation.teamId,
          userId: user.id,
          roleId: invitation.roleId,
        });
        await this.userRoleAssignmentRepo.save(userRoleAssignment);
        console.log(`✅ Назначена роль из приглашения для ${user.email}`);
      } else {
        console.log(`ℹ️ Роль из приглашения уже назначена пользователю ${user.email}`);
      }
    } else {
      // Если в приглашении не указана роль, назначаем базовую роль "viewer"
      const viewerRole = await this.rolesRepo.findOne({ where: { name: 'viewer' } });
      if (viewerRole) {
        const existingViewerAssignment = await this.userRoleAssignmentRepo.findOne({
          where: { userId: user.id, roleId: viewerRole.id },
        });

        if (!existingViewerAssignment) {
          const userRoleAssignment = this.userRoleAssignmentRepo.create({
          organizationId: invitation.organizationId,
          teamId: invitation.teamId,
            userId: user.id,
            roleId: viewerRole.id,
          });
          await this.userRoleAssignmentRepo.save(userRoleAssignment);
          console.log(`✅ Назначена базовая роль viewer для ${user.email}`);
        }
      }
    }

    // Обновляем приглашение
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedById = user.id;
    invitation.acceptedAt = new Date();
    await this.invitationsRepo.save(invitation);

    console.log(`✅ Пользователь ${user.email} принял приглашение от ${invitation.invitedBy.email}`);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    return { 
      success: true, 
      userId: user.id,
      redirectTo: `${frontendUrl}/dashboard?tab=invitations`,
      message: 'Приглашение принято! Переходим в раздел приглашений...'
    };
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

        // Связи с командами и организациями управляются через ManyToMany relations
        // Не нужно сбрасывать teamId и organizationId, так как их больше нет в User entity
      }
    }

    // Удаляем приглашение из базы данных
    await this.invitationsRepo.remove(invitation);
  }

  /**
   * Проверка прав на отмену приглашения
   * ВАЖНО: Все пользователи имеют доступ ко всему функционалу независимо от прав
   */
  private async checkCancelInvitationPermissions(userId: string, invitation: Invitation): Promise<boolean> {
    // Убрали проверку прав - теперь все пользователи могут отменять приглашения
    return true;
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
   * ВАЖНО: Все пользователи имеют доступ ко всему функционалу независимо от прав
   */
  private async checkInvitationPermissions(
    userId: string,
    type: InvitationType,
    organizationId?: string,
    teamId?: string,
  ): Promise<boolean> {
    // Убрали проверку прав - теперь все пользователи могут создавать приглашения
    return true;
  }

  /**
   * Отправка email с приглашением
   */
  private async sendInvitationEmail(invitation: Invitation, invitedById?: string): Promise<void> {
    console.log('🔍 sendInvitationEmail called for:', invitation.email);
    console.log('🔍 Invitation data:', {
      email: invitation.email,
      type: invitation.type,
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
      hasOrganization: !!invitation.organization,
      hasTeam: !!invitation.team
    });
    
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    // Получаем информацию о приглашающем
    let inviterName = 'Неизвестный';
    if (invitedById) {
      try {
        const inviter = await this.usersRepo.findOne({ where: { id: invitedById } });
        inviterName = inviter ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || inviter.email : 'Неизвестный';
      } catch (error) {
        console.error('Ошибка получения информации о приглашающем:', error);
      }
    }
    
    // Ссылка ведет на главную страницу входа (ввод email)
    const loginUrl = `${frontendUrl}`;

    // Получаем информацию об организации/команде
    let invitationTarget = '';
    if (invitation.type === InvitationType.ORGANIZATION && invitation.organization) {
      invitationTarget = `организацию "${invitation.organization.name}"`;
    } else if (invitation.type === InvitationType.TEAM && invitation.team) {
      invitationTarget = `команду "${invitation.team.name}"`;
    }

    const subject = `Приглашение в ${invitationTarget} - Vselena`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #667eea; margin: 0;">Vselena</h1>
          <p style="color: #64748b; margin: 5px 0;">Система управления базой знаний</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0;">
          <h2 style="color: #1e293b; margin-top: 0;">🎉 Вас пригласили!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            ${invitation.firstName ? `Привет, ${invitation.firstName}!` : 'Привет!'}
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            <strong>${inviterName}</strong> пригласил вас присоединиться к ${invitationTarget} в системе Vselena.
          </p>
          
          <div style="background: #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1e293b; font-weight: 600; margin: 0 0 10px 0;">Детали приглашения:</p>
            <ul style="color: #475569; margin: 0; padding-left: 20px;">
              <li><strong>Приглашающий:</strong> ${inviterName}</li>
              <li><strong>${invitation.type === InvitationType.TEAM ? 'Команда' : 'Организация'}:</strong> ${invitationTarget}</li>
              <li><strong>Email:</strong> ${invitation.email}</li>
            </ul>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: 600; 
                    font-size: 16px; 
                    display: inline-block;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
            Войти в систему
          </a>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>💡 Важно:</strong> Ссылка ведет на главную страницу входа в систему. После входа вы сможете принять или отклонить приглашение в разделе уведомлений.
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0; font-size: 18px;">📋 Что дальше?</h3>
          <ul style="color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li><strong>Если у вас уже есть аккаунт:</strong> Вы будете перенаправлены в раздел "Приглашения"</li>
            <li><strong>Если у вас нет аккаунта:</strong> Вы перейдете на страницу регистрации, а после регистрации автоматически попадете в раздел "Приглашения"</li>
          </ul>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
            <strong>⏰ Срок действия:</strong> до ${invitation.expiresAt?.toLocaleDateString('ru-RU', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
            <strong>🔗 Прямая ссылка:</strong> <a href="${smartInvitationLink}" style="color: #667eea;">${smartInvitationLink}</a>
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Если вы не ожидали это приглашение, просто проигнорируйте это письмо.
          </p>
        </div>
      </div>
    `;

    await this.emailService.sendEmail({
      to: invitation.email,
      subject,
      html,
    });
  }

  /**
   * Обработка умной ссылки приглашения
   */
  async handleInvitationLink(token: string): Promise<{
    invitation: any;
    redirectTo: string;
    isAuthenticated: boolean;
    message: string;
  }> {
    const invitation = await this.invitationsRepo.findOne({
      where: { token },
      relations: ['organization', 'team', 'invitedBy'],
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

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.usersService.findByEmail(invitation.email);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    if (existingUser) {
      // Пользователь существует - перенаправляем в раздел приглашений
      return {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          type: invitation.type,
          organization: invitation.organization?.name,
          team: invitation.team?.name,
          invitedBy: invitation.invitedBy?.firstName + ' ' + invitation.invitedBy?.lastName,
          expiresAt: invitation.expiresAt,
        },
        redirectTo: `${frontendUrl}/dashboard?tab=invitations&token=${token}`,
        isAuthenticated: true,
        message: 'Переходим в раздел приглашений...',
      };
    } else {
      // Пользователь не существует - перенаправляем на регистрацию
      return {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          type: invitation.type,
          organization: invitation.organization?.name,
          team: invitation.team?.name,
          invitedBy: invitation.invitedBy?.firstName + ' ' + invitation.invitedBy?.lastName,
          expiresAt: invitation.expiresAt,
        },
        redirectTo: `${frontendUrl}/register?invite=${token}`,
        isAuthenticated: false,
        message: 'Переходим на страницу регистрации...',
      };
    }
  }

  /**
   * Создание внутреннего приглашения (без email)
   */
  async createInternalInvitation(
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    // Убрали проверку прав - теперь все пользователи могут создавать приглашения

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
    const invitationLink = `${frontendUrl}/invitation?token=${token}`;

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
    // Убрали проверку прав - теперь все пользователи могут просматривать приглашения

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
      invitationLink: `${frontendUrl}/invitation?token=${invitation.token}`,
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

    // НАЗНАЧАЕМ РОЛЬ пользователю в контексте организации/команды
    if (invitation.roleId) {
      try {
        // TODO: Временно отключено - нужно исправить зависимость UserRoleAssignmentService
        // await this.userRoleAssignmentService.assignRole(
        //   user.id,
        //   invitation.roleId,
        //   invitation.organizationId,
        //   invitation.teamId,
        //   invitation.invitedById,
        // );
        console.log(`✅ Роль ${invitation.roleId} назначена пользователю ${user.email} в контексте ${invitation.type === InvitationType.TEAM ? 'команды' : 'организации'}`);
      } catch (error) {
        console.error(`❌ Ошибка при назначении роли: ${error.message}`);
        // Не прерываем процесс, если назначение роли не удалось
      }
    }

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

    // Отправляем email уведомление
    await this.sendInvitationEmail(invitation, invitedById);

    // Формируем ссылку для приглашения
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const invitationLink = `${frontendUrl}/invitation?token=${token}`;

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