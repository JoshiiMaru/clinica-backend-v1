import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany, Column } from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { DetalleProcedimiento } from './detalle-procedimiento.entity';
import { DetalleProducto } from './detalle-producto.entity';

@Entity('atenciones')
export class Atencion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;

  // NUEVO: Etiqueta para saber si vino por Atención Directa o por Cita
  @Column({ type: 'varchar', default: 'ATENCION' })
  origen: string;

  // Relación con el Paciente (Se mantiene intacta)
  @ManyToOne(() => Paciente, (paciente) => paciente.atenciones, { eager: true, cascade: true })
  paciente: Paciente;

  // Relación con sus múltiples procedimientos hijos
  @OneToMany(() => DetalleProcedimiento, (dp) => dp.atencion, { cascade: true, eager: true })
  procedimientos: DetalleProcedimiento[];

  // NUEVO: Relación con sus múltiples productos hijos
  @OneToMany(() => DetalleProducto, (dp) => dp.atencion, { cascade: true, eager: true })
  productos: DetalleProducto[];
}