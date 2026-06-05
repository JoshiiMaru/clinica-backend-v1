import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Atencion } from './atencion.entity';

@Entity('detalles_productos')
export class DetalleProducto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombreProducto: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoTotal: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montoPagado: number;

  @Column({ default: false })
  esDeuda: boolean;

  // Relación con la Atención principal
  @ManyToOne(() => Atencion, (atencion) => atencion.productos, { onDelete: 'CASCADE' })
  atencion: Atencion;
}