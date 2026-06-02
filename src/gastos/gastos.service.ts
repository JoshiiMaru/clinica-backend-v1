import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gasto } from './entities/gasto.entity';

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private gastoRepo: Repository<Gasto>,
  ) {}

  async registrar(datos: Partial<Gasto>): Promise<Gasto> {
    const nuevoGasto = this.gastoRepo.create(datos);
    return await this.gastoRepo.save(nuevoGasto);
  }

  async obtenerGastos(): Promise<Gasto[]> {
    return await this.gastoRepo.find();
  }

  // NUEVO: OBTENER GASTOS FILTRADOS POR RANGO DE FECHAS
  async obtenerGastosFiltrados(inicio: string, fin: string): Promise<Gasto[]> {
    return await this.gastoRepo.createQueryBuilder('gasto')
      .where('DATE(gasto.fecha) BETWEEN :inicio AND :fin', { inicio, fin })
      .orderBy('gasto.fecha', 'DESC')
      .getMany();
  }

  async obtenerGastosHoy(): Promise<Gasto[]> {
    return await this.gastoRepo.createQueryBuilder('gasto')
      .where('DATE(gasto.fecha) = CURRENT_DATE')
      .orderBy('gasto.fecha', 'DESC') // Los más recientes primero
      .getMany();
  }
}