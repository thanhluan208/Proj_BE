import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS if needed
  app.enableCors('*');

  // Set global API prefix
  const apiPrefix = configService.get('app.apiPrefix', { infer: true });
  app.setGlobalPrefix(apiPrefix);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Project Management API')
    .setDescription('API documentation for Project Management System')
    .setVersion('1.0')
    .addBearerAuth() // Add this if you plan to use JWT authentication
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep authorization when page refreshes
    },
  });

  // Get port from app configuration
  const port = configService.get('app.port', { infer: true }) || 3000;

  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
