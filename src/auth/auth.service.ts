import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    private jwtService: JwtService,
    private configService: ConfigService,
) {}

  // -------------------------------------------------------------
  // LÓGICA DE TOKENS
  // -------------------------------------------------------------
async getTokens(userId: string, username: string, rol: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, username, rol },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          // Añadimos un valor por defecto ('15m') y as any para el tipado estricto
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m') as any,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, username, rol },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          // Añadimos un valor por defecto ('7d') y as any
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usuarioRepo.update(userId, { refreshToken: hash });
  }

  // -------------------------------------------------------------
  // MÉTODOS DEL CONTROLADOR
  // -------------------------------------------------------------

  // Método para crear usuarios iniciales (¡Ahora encripta la clave!)
  async crearUsuarioBase(username: string, clavePlana: string, rol: any) {
    // 1. Encriptamos la contraseña antes de guardarla
    const passwordHash = await bcrypt.hash(clavePlana, 10);
    
    const nuevoUsuario = this.usuarioRepo.create({ username, passwordHash, rol });
    return await this.usuarioRepo.save(nuevoUsuario);
  }

  // Método de Login actualizado
  async login(username: string, clavePlana: string) {
  // 1. Log temporal para verificar qué está llegando al backend
  console.log('Datos recibidos en login:', { username, clavePlana });

  const usuario = await this.usuarioRepo.findOne({ where: { username } });

  if (!usuario) {
    throw new UnauthorizedException('Credenciales incorrectas');
  }

  // 2. Verificación de seguridad antes de ejecutar bcrypt
  if (!clavePlana || !usuario.passwordHash) {
    throw new UnauthorizedException(
      `Faltan argumentos. Clave recibida: ${!!clavePlana}, Hash en BD: ${!!usuario.passwordHash}`
    );
  }

  // 3. Comparación segura
  const isPasswordMatching = await bcrypt.compare(clavePlana, usuario.passwordHash);
  if (!isPasswordMatching) {
    throw new UnauthorizedException('Credenciales incorrectas');
  }

  const tokens = await this.getTokens(usuario.id, usuario.username, usuario.rol);
  await this.updateRefreshTokenHash(usuario.id, tokens.refreshToken);

  return {
    mensaje: 'Login exitoso',
    usuario: {
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
    },
    ...tokens
  };
}

  // Nuevo método: Para renovar el Access Token
  async refreshTokens(userId: string, rtString: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: userId } });
    
    // Si no hay usuario o no tiene refresh token guardado
    if (!usuario || !usuario.refreshToken) {
      throw new UnauthorizedException('Acceso denegado');
    }

    // Comparamos el token recibido con el hash guardado en BD
    const rtMatches = await bcrypt.compare(rtString, usuario.refreshToken);
    if (!rtMatches) {
      throw new UnauthorizedException('Acceso denegado');
    }

    // Si todo está bien, generamos nuevos tokens
    const tokens = await this.getTokens(usuario.id, usuario.username, usuario.rol);
    await this.updateRefreshTokenHash(usuario.id, tokens.refreshToken);
    
    return tokens;
  }
  
  // Opcional pero recomendado: Método para cerrar sesión (borra el refresh token)
  async logout(userId: string) {
    await this.usuarioRepo.update(userId, { refreshToken: null });
    return { mensaje: 'Sesión cerrada exitosamente' };
  }
}