import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars-long',
  expiresIn: process.env.JWT_EXPIRATION || '2h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-min-32-chars-long-very-secure',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
