import { DataSource } from 'typeorm';
import { seedDefaultData } from './seeds/default-data.seed';

async function runSeeds() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'loginus',
    password: process.env.DB_PASSWORD || 'loginus_secret',
    database: process.env.DB_DATABASE || 'loginus_dev',
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    await seedDefaultData(dataSource);
    
    await dataSource.destroy();
    console.log('✅ Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();
