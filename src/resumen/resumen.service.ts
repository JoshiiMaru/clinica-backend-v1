import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Atencion } from '../atenciones/entities/atencion.entity';
import { Gasto } from '../gastos/entities/gasto.entity';

@Injectable()
export class ResumenService {
  constructor(
    @InjectRepository(Atencion) private atencionRepo: Repository<Atencion>,
    @InjectRepository(Gasto) private gastoRepo: Repository<Gasto>,
  ) {}

  // Ahora recibe inicio y fin desde el frontend
  async obtenerResumen(inicio?: string, fin?: string) {
    // Si no llegan fechas, por defecto buscamos el día de hoy
    const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const fechaInicio = inicio || hoy;
    const fechaFin = fin || hoy;

    // 1. Buscamos ingresos usando BETWEEN para atrapar todo el rango
    const atenciones = await this.atencionRepo.createQueryBuilder('atencion')
      .leftJoinAndSelect('atencion.paciente', 'paciente')
      .leftJoinAndSelect('atencion.procedimientos', 'procedimientos')
      .where('DATE(atencion.fecha) BETWEEN :inicio AND :fin', { inicio: fechaInicio, fin: fechaFin })
      .getMany();

    // 2. Buscamos los gastos usando el mismo rango
    const gastos = await this.gastoRepo.createQueryBuilder('gasto')
      .where('DATE(gasto.fecha) BETWEEN :inicio AND :fin', { inicio: fechaInicio, fin: fechaFin })
      .getMany();

    // 3. Formateamos el título para el frontend (ej. "2026-05-01 al 2026-05-31")
    const tituloFecha = fechaInicio === fechaFin ? fechaInicio : `${fechaInicio} al ${fechaFin}`;

    // 4. Mapeamos ingresos desglosados por cada procedimiento individual
    const ingresos = atenciones.flatMap(a =>
      a.procedimientos.map(p => ({
        fecha: a.fecha,
        descripcion: `Ingreso - ${p.nombreProcedimiento} (${a.paciente.nombre})`,
        monto: Number(p.montoPagado),
        tipo: 'INGRESO',
      }))
    );

    // 5. Mapeamos gastos
    const egresos = gastos.map(g => ({
      fecha: g.fecha,
      descripcion: `Gasto - ${g.descripcion}`,
      monto: Number(g.monto),
      tipo: 'GASTO',
    }));

    // 6. Unimos y ordenamos cronológicamente
    const resumenUnificado = [...ingresos, ...egresos].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    const totalIngresos = ingresos.reduce((sum, item) => sum + item.monto, 0);
    const totalGastos = egresos.reduce((sum, item) => sum + item.monto, 0);
    const balanceNeto = totalIngresos - totalGastos;

    return {
      fecha: tituloFecha,
      movimientos: resumenUnificado,
      totalIngresos,
      totalGastos,
      balanceNeto,
    };
  }
}