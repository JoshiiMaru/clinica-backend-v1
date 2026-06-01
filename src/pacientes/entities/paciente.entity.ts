import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Atencion } from '../../atenciones/entities/atencion.entity';

@Entity('pacientes')
export class Paciente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 8 })
  dni: string;

  @Column()
  nombre: string;

  @Column()
  celular: string;

  @OneToMany(() => Atencion, (atencion) => atencion.paciente)
  atenciones: Atencion[];
}