import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

process.env.TZ = 'UTC';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'https://clinica-frontend-v1.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization', // Crucial para JWT e intercambio de JSON
  });

  const puerto = process.env.PORT || 8080;

  await app.listen(puerto, '0.0.0.0'); 
  console.log(`Aplicación corriendo en el puerto: ${puerto}`);
}
bootstrap();