import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Turn on CORS to Client (3000) can call Server (3001)
  app.enableCors({
    origin: 'http://localhost:3000',
    // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // const port = process.env.PORT || 3001;
  // await app.listen(port);
  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Server đang chạy tại: http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
