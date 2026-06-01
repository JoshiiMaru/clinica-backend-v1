import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitamos CORS para que Angular pueda hacer peticiones
  app.enableCors(); 
  
  await app.listen(3000);
}
bootstrap();
