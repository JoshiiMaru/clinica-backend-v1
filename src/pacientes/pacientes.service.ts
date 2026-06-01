import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private pacienteRepo: Repository<Paciente>,
  ) {}

  // Buscar paciente único por DNI
  async buscarPorDni(dni: string): Promise<Paciente | null> {
    return await this.pacienteRepo.findOne({ where: { dni } });
  }
}