import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:3000');
  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, с файловой системы)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        frontendUrl,
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:8081',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:8081',
        'https://loginus.ldmco.ru',
        'http://45.144.176.42:3000',
        'http://45.144.176.42:3002',
        'https://loginus.ldmco.ru',
        'http://loginus.ldmco.ru',
        'https://vselena.ldmco.ru',
        'http://vselena.ldmco.ru'
      ];
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger setup
  if (configService.get('app.swaggerEnabled') !== false) {
    const config = new DocumentBuilder()
      .setTitle('Loginus API')
      .setDescription('API документация для системы управления базой знаний и поддержкой')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Введите JWT токен',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Аутентификация и авторизация')
      .addTag('users', 'Управление пользователями')
      .addTag('roles', 'Управление ролями')
      .addTag('permissions', 'Управление правами')
      .addTag('organizations', 'Организации')
      .addTag('teams', 'Команды')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Loginus API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get('app.port') || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();