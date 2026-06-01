import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RolUsuario } from '../enums/rol-usuario.enum';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.RECEPCIONISTA })
  rol: RolUsuario;
}