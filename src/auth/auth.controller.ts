import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AccessTokenGuard } from './guards/access-token.guard';

// 2. Crea esta pequeña interfaz arriba de tu controlador
export interface RequestWithUser extends Request {
  user: any; 
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('crear')
  crear(@Body() datos: any) {
    return this.authService.crearUsuarioBase(datos.username, datos.password, datos.rol);
  }

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  // IMPORTANTE: Este endpoint usa un Guard específico para validar el Refresh Token
  @UseGuards(RefreshTokenGuard) 
  @Post('refresh')
  refreshTokens(@Req() req: RequestWithUser) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user['sub']);
  }
}