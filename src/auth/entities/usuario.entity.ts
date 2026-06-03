import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RolUsuario } from '../enums/rol-usuario.enum';
import { BaseEntity } from '@/core/base.entity';

@Entity('usuarios')
export class Usuario extends BaseEntity {

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.RECEPCIONISTA })
  rol: RolUsuario;

  @Column({ type: 'varchar', nullable: true })
  refreshToken?: string | null;
}