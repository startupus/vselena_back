  /**
   * Получение сотрудников команд/организаций пользователя
   * Показываем всех пользователей команд организации или конкретной команды
   */
  async getTeamMembers(userId: string): Promise<User[]> {
    // Получаем команды и организации текущего пользователя
    const currentUser = await this.findById(userId, { relations: ['organizations', 'teams'] });
    if (!currentUser) {
      return [];
    }

    const userOrgIds = currentUser.organizations?.map(org => org.id) || [];
    const userTeamIds = currentUser.teams?.map(team => team.id) || [];

    console.log(`🔍 Current user ${currentUser.email} has orgs: ${userOrgIds.length}, teams: ${userTeamIds.length}`);

    if (userOrgIds.length === 0 && userTeamIds.length === 0) {
      console.log(`❌ User ${currentUser.email} has no organizations or teams`);
      return []; // У пользователя нет команд/организаций
    }

    let targetTeamIds: string[] = [];

    // Если пользователь состоит в организации - получаем ВСЕ команды этой организации
    if (userOrgIds.length > 0) {
      console.log(`🔍 User is in organizations, getting all teams from orgs: ${userOrgIds.join(', ')}`);
      
      // Получаем все команды организаций пользователя через SQL запрос
      const orgTeamsResult = await this.usersRepo.query(`
        SELECT id FROM teams 
        WHERE "organizationId" = ANY($1)
      `, [userOrgIds]);
      
      targetTeamIds = orgTeamsResult.map((team: any) => team.id);
      console.log(`🔍 Found ${targetTeamIds.length} teams in user's organizations`);
    }
    
    // Если пользователь состоит только в командах (без организаций) - используем его команды
    if (userOrgIds.length === 0 && userTeamIds.length > 0) {
      console.log(`🔍 User is only in teams, using user's teams: ${userTeamIds.join(', ')}`);
      targetTeamIds = userTeamIds;
    }

    if (targetTeamIds.length === 0) {
      console.log(`❌ No target teams found`);
      return [];
    }

    // Находим всех пользователей, которые состоят в целевых командах
    const query = this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organizations', 'organizations')
      .leftJoinAndSelect('user.teams', 'teams')
      .where('user.id != :userId', { userId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('teams.id IN (:...teamIds)', { teamIds: targetTeamIds });

    const users = await query.getMany();
    console.log(`🔍 Found ${users.length} users in target teams`);

    // Фильтруем пользователей без команд/организаций
    const filteredUsers = users.filter(user => 
      (user.organizations && user.organizations.length > 0) || 
      (user.teams && user.teams.length > 0)
    );

    console.log(`🔍 After filtering: ${filteredUsers.length} users`);
    
    // Добавляем роли с контекстом для каждого пользователя
    const usersWithRoles = await Promise.all(
      filteredUsers.map(async (user) => {
        const rolesByContext = await this.getUserRolesWithContext(user.id);
        return {
          ...user,
          rolesByContext
        };
      })
    );

    return usersWithRoles;
  }
