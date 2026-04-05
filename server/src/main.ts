import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
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

  // Áp dụng Interceptor để serialize class, xử lý @Exclude()
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Cài đặt prefix api cho toàn cục
  app.setGlobalPrefix('api');

  // 2. Cấu hình CORS linh hoạt
  // Khi deploy, CORS_ORIGIN sẽ là link Vercel của bạn
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  // Tách chuỗi thành mảng nếu có dấu phẩy, và luôn bao gồm localhost để dev tiện lợi
  const originList = corsOrigin.split(',').map(item => item.trim());
  if (!originList.includes('http://localhost:3000')) {
    originList.push('http://localhost:3000');
  }

  app.enableCors({
    origin: originList,
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
