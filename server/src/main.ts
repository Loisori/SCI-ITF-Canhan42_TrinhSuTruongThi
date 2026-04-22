import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  Logger,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.setGlobalPrefix('api');

  const corsOrigin = process.env.CORS_ORIGIN || '';
  const originList = corsOrigin
    .split(',')
    .filter(Boolean)
    .map((item) => item.trim());

  // Always allow localhost for development convenience
  if (!originList.includes('http://localhost:3000')) {
    originList.push('http://localhost:3000');
  }

  app.enableCors({
    origin: originList,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 InvestPro Backend is running on: ${await app.getUrl()}`);
  logger.log(`🌍 Accepting requests from: ${corsOrigin}`);
}
bootstrap();
