import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('crear')
  crear(@Body() datos: any) {
    return this.authService.crearUsuarioBase(datos.username, datos.password, datos.rol);
  }

  @Post('login')
  login(@Body() datos: any) {
    return this.authService.login(datos.username, datos.password);
  }
}