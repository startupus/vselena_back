export interface JwtPayload {
  sub: string;              // userId (subject)
  email: string | null;     // Email пользователя (может быть null для OAuth)
  organizationId: string | null;   // ID организации
  teamId?: string | null;          // ID команды (может быть null)
  roles: string[];          // ['admin', 'manager']
  permissions: string[];    // ['users.create', 'knowledge.read']
  iat?: number;             // issued at (timestamp)
  exp?: number;             // expires at (timestamp)
}
