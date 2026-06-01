import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
  ) {}

  // Método para crear usuarios iniciales (puedes usarlo en Postman una sola vez)
  async crearUsuarioBase(username: string, passwordHash: string, rol: any) {
    const nuevoUsuario = this.usuarioRepo.create({ username, passwordHash, rol });
    return await this.usuarioRepo.save(nuevoUsuario);
  }

  // Método de Login
  async login(username: string, passwordHash: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { username } });

    // Validamos que exista y que la clave coincida
    if (!usuario || usuario.passwordHash !== passwordHash) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Retornamos los datos necesarios para que Angular sepa qué botones mostrar
    return {
      mensaje: 'Login exitoso',
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol, 
    };
  }
}