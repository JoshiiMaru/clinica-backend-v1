import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  // NUEVO: Obtener todos los pacientes o filtrar por búsqueda
  async obtenerPacientes(termino?: string): Promise<Paciente[]> {
    const query = this.pacienteRepo.createQueryBuilder('paciente');

    if (termino) {
      // Usamos ILIKE para Postgres (ignora mayúsculas/minúsculas)
      query.where('paciente.dni LIKE :termino OR paciente.nombre ILIKE :termino', {
        termino: `%${termino}%`
      });
    }

    // Ordenamos alfabéticamente por nombre
    return await query.orderBy('paciente.nombre', 'ASC').getMany();
  }

  // NUEVO: Crear un paciente manualmente desde el directorio
  async crearPaciente(datos: any): Promise<Paciente> {
    const existe = await this.pacienteRepo.findOne({ where: { dni: datos.dni } });
    if (existe) {
      throw new BadRequestException('Ya existe un paciente registrado con ese DNI');
    }

    const nuevoPaciente = this.pacienteRepo.create({
      dni: datos.dni,
      nombre: datos.nombre,
      celular: datos.celular || ''
    });

    return await this.pacienteRepo.save(nuevoPaciente);
  }

  // NUEVO: Actualizar nombre y/o celular del paciente
  async actualizarPaciente(id: string, datos: any): Promise<Paciente> {
    const paciente = await this.pacienteRepo.findOne({ where: { id } });
    
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Actualizamos solo los campos permitidos
    if (datos.nombre) paciente.nombre = datos.nombre;

    if (datos.dni && datos.dni !== paciente.dni) {
      const existeDni = await this.pacienteRepo.findOne({ where: { dni: datos.dni } });
      if (existeDni) {
        throw new BadRequestException('Ya existe otro paciente registrado con ese DNI');
      }
      paciente.dni = datos.dni;
    }

    if (datos.celular !== undefined) paciente.celular = datos.celular; // Permite vaciar el celular si es necesario

    return await this.pacienteRepo.save(paciente);
  }
}