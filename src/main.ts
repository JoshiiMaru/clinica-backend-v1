import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'https://clinica-frontend-v1.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization', // Crucial para JWT e intercambio de JSON
  });

  const puerto = process.env.PORT || 3000;
  await app.listen(puerto);
  console.log(`Aplicación corriendo en el puerto: ${puerto}`);
}
bootstrap();