export interface JwtPayload {
  sub: string;              // userId (subject)
  email: string;            // Email пользователя
  organizationId: string | null;   // ID организации
  teamId?: string | null;          // ID команды (может быть null)
  roles: string[];          // ['admin', 'manager']
  permissions: string[];    // ['users.create', 'knowledge.read']
  iat?: number;             // issued at (timestamp)
  exp?: number;             // expires at (timestamp)
}
