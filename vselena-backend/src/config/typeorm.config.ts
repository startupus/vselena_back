import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'vselena',
  password: process.env.DB_PASSWORD || 'vselena_secret',
  database: process.env.DB_DATABASE || 'vselena_dev',
  migrations: ['src/database/migrations/*.ts'],
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
  logging: false,
});
