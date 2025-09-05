import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { envs } from '@common/config';

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
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });
  await app.listen(envs.port);
}
bootstrap();
