  /**
   * Получение сотрудников команд/организаций пользователя
   * Показываем пользователей из команд, которые создал пользователь, в которых он член, или из организаций, которые он создал
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
      return [];
    }

    const teamIds = new Set<string>();
    
    // Добавляем команды, в которых пользователь является членом
    if (userTeamIds.length > 0) {
      userTeamIds.forEach(teamId => teamIds.add(teamId));
      console.log(`🔍 Added user's teams: ${userTeamIds.join(', ')}`);
    }

    // Добавляем команды, которые создал пользователь
    const createdTeams = await this.usersRepo
      .createQueryBuilder()
      .select('team.id')
      .from('teams', 'team')
      .where('team.createdBy = :userId', { userId })
      .getRawMany();

    createdTeams.forEach(team => teamIds.add(team.team_id));
    console.log(`🔍 Added created teams: ${createdTeams.length}`);

    // Если пользователь состоит в организации - добавляем ВСЕ команды этой организации
    if (userOrgIds.length > 0) {
      console.log(`🔍 User is in organizations, getting all teams from orgs: ${userOrgIds.join(', ')}`);
      
      // Получаем все команды организаций пользователя
      const orgTeamsResult = await this.usersRepo.query(`
        SELECT id FROM teams 
        WHERE "organizationId" = ANY($1)
      `, [userOrgIds]);
      
      orgTeamsResult.forEach((team: any) => teamIds.add(team.id));
      console.log(`🔍 Added organization teams: ${orgTeamsResult.length}`);
    }

    if (teamIds.size === 0) {
      console.log(`❌ No target teams found`);
      return [];
    }

    console.log(`🔍 Total target teams: ${teamIds.size}`);

    // Получаем всех пользователей из целевых команд
    const teamMembers = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.teams', 'team')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('team.id IN (:...teamIds)', { teamIds: Array.from(teamIds) })
      .andWhere('user.id != :userId', { userId }) // Исключаем самого пользователя
      .getMany();

    console.log(`🔍 Found ${teamMembers.length} team members`);
    return teamMembers;
  }
