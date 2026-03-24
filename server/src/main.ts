import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Cấu hình Validation toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 2. Cấu hình CORS linh hoạt
  // Khi deploy, CORS_ORIGIN sẽ là link Vercel của bạn
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  // Tách chuỗi thành mảng nếu có dấu phẩy
const originList = corsOrigin.split(',').map(item => item.trim());

  app.enableCors({
    origin: originList, // Truyền mảng các link được phép vào đây
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. Lắng nghe trên 0.0.0.0 (Bắt buộc cho các Cloud Hosting)
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 InvestPro Backend is running on: ${await app.getUrl()}`);
  logger.log(`🌍 Accepting requests from: ${corsOrigin}`);
}
bootstrap();
