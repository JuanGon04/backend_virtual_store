import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { envs } from '@common/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as expressBasicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origins =
    envs.environment === 'prod' ? envs.originsProd : envs.originsDev;
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: origins,
    methods: 'GET,HEAD,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  // Configuración Swagger
  if (envs.environment !== 'dev') {
    app.use(
      ['/api/docs', '/api/docs#/', '/api/docs-json'], // rutas de swagger
      expressBasicAuth({
        challenge: true,
        users: {
          [envs.swagger_user]: envs.swagger_secret, // usuario: contraseña
        },
      }),
    );
  }

  const config = new DocumentBuilder()
    .setTitle('API de Productos')
    .setDescription('Documentación de la API de productos con NestJS y Swagger')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(envs.port);
}
bootstrap();
