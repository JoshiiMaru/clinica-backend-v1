import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Atencion } from './atencion.entity';

@Entity('detalles_procedimientos')
export class DetalleProcedimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombreProcedimiento: string;

  // AGREGAMOS "| null" A LAS VARIABLES OPCIONALES
  @Column({ type: 'date', nullable: true })
  fechaProximaCita: Date | null;

  @Column({ type: 'varchar', nullable: true })
  horaProximaCita: string | null;

  // NUEVO: Control de estado de la cita (false = pendiente, true = ya se atendió)
  @Column({ default: false })
  citaAtendida: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoTotal: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montoPagado: number;

  @Column({ default: false })
  esDeuda: boolean;

  @ManyToOne(() => Atencion, (atencion) => atencion.procedimientos, { onDelete: 'CASCADE' })
  atencion: Atencion;
}