import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
  logLevel: process.env.LOG_LEVEL || 'debug',
}));
