import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Atencion } from './entities/atencion.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { DetalleProcedimiento } from './entities/detalle-procedimiento.entity';

@Injectable()
export class AtencionesService {
  constructor(
    @InjectRepository(Atencion) private atencionRepo: Repository<Atencion>,
    @InjectRepository(Paciente) private pacienteRepo: Repository<Paciente>,
    @InjectRepository(DetalleProcedimiento) private detalleRepo: Repository<DetalleProcedimiento>,
  ) {}

  // REGISTRO DE ATENCIÓN Y PROCEDIMIENTOS CON MONTOS PROPIOS
  async registrar(datos: any): Promise<Atencion> {
    const { paciente: datosPaciente, procedimientos } = datos;

    // 1. Buscar o crear al paciente por DNI
    let pacienteGuardado = await this.pacienteRepo.findOne({ where: { dni: datosPaciente.dni } });
    if (!pacienteGuardado) {
      const nuevoPaciente = this.pacienteRepo.create({
        dni: datosPaciente.dni,
        nombre: datosPaciente.nombre,
        celular: datosPaciente.celular
      });
      pacienteGuardado = await this.pacienteRepo.save(nuevoPaciente);
    }

    // 2. Crear el contenedor principal de la atención
    const nuevaAtencion = this.atencionRepo.create({
      paciente: pacienteGuardado,
      origen: 'ATENCION'
    });
    const atencionGuardada = await this.atencionRepo.save(nuevaAtencion);

    // 3. Registrar cada procedimiento calculando su propio estado financiero
    if (procedimientos && procedimientos.length > 0) {
      const detalles = procedimientos.map(proc => {
        const total = proc.montoTotal !== null && proc.montoTotal !== undefined ? Number(proc.montoTotal) : null;
        const pagado = Number(proc.montoPagado) || 0;
        
        // REQUERIMIENTO: La deuda se calcula individualmente por procedimiento
        let esDeuda = false;
        if (total !== null && total > 0) {
          esDeuda = pagado < total;
        }

        return this.detalleRepo.create({
          nombreProcedimiento: proc.nombreProcedimiento,
          fechaProximaCita: proc.fechaProximaCita || null, // Opcional
          horaProximaCita: proc.horaProximaCita || null,   // NUEVO: Hora opcional
          montoTotal: total,
          montoPagado: pagado,
          esDeuda,
          atencion: atencionGuardada,
        });
      });
      
      await this.detalleRepo.save(detalles);
    }

    return atencionGuardada;
  }

  // REQUERIMIENTO: Editar procedimiento (Nombre, cita, hora y montos)
  async actualizarProcedimiento(idProcedimiento: string, datos: any): Promise<DetalleProcedimiento> {
    const procedimiento = await this.detalleRepo.findOne({ where: { id: idProcedimiento } });
    if (!procedimiento) throw new NotFoundException('Procedimiento no encontrado');

    // Actualizamos los campos de texto y citas
    procedimiento.nombreProcedimiento = datos.nombreProcedimiento;
    procedimiento.fechaProximaCita = datos.fechaProximaCita || null;
    procedimiento.horaProximaCita = datos.horaProximaCita || null;

    // Actualizamos montos financieros
    const total = datos.montoTotal !== null && datos.montoTotal !== undefined ? Number(datos.montoTotal) : null;
    const pagado = Number(datos.montoPagado) || 0;

    procedimiento.montoTotal = total;
    procedimiento.montoPagado = pagado;

    // Recalculamos si este procedimiento específico queda con deuda
    if (total !== null && total > 0) {
      procedimiento.esDeuda = pagado < total;
    } else {
      procedimiento.esDeuda = false;
    }

    return await this.detalleRepo.save(procedimiento);
  }

  // ABONAR A LA DEUDA DE UN PROCEDIMIENTO ESPECÍFICO
  async abonarDeudaProcedimiento(idProcedimiento: string, abono: number): Promise<DetalleProcedimiento> {
    const procedimiento = await this.detalleRepo.findOne({ where: { id: idProcedimiento } });
    if (!procedimiento) throw new NotFoundException('Procedimiento no encontrado');

    procedimiento.montoPagado = Number(procedimiento.montoPagado) + Number(abono);

    if (procedimiento.montoTotal && procedimiento.montoPagado >= procedimiento.montoTotal) {
      procedimiento.esDeuda = false;
    }

    return await this.detalleRepo.save(procedimiento);
  }

  // OBTENER DEUDAS CON FILTRO INTELIGENTE POR FECHAS Y TERMINO (DNI o Nombre)
  async obtenerDeudas(inicio: string, fin: string, termino?: string): Promise<DetalleProcedimiento[]> {
    const query = this.detalleRepo.createQueryBuilder('procedimiento')
      .leftJoinAndSelect('procedimiento.atencion', 'atencion')
      .leftJoinAndSelect('atencion.paciente', 'paciente')
      .where('procedimiento.esDeuda = :deuda', { deuda: true });

    // 1. Filtro por rango de fechas
    if (inicio && fin) {
      query.andWhere('DATE(atencion.fecha) BETWEEN :inicio AND :fin', { inicio, fin });
    }

    // 2. Filtro por término (DNI o Nombre)
    if (termino) {
      // Usamos paréntesis para agrupar el OR y no romper las condiciones anteriores
      query.andWhere(
        '(paciente.dni LIKE :termino OR paciente.nombre LIKE :termino)', 
        { termino: `%${termino}%` }
      );
    }

    return await query.orderBy('atencion.fecha', 'DESC').getMany();
  }

  // OBTENER ATENCIONES DE HOY
  async obtenerAtencionesHoy(): Promise<Atencion[]> {
    return await this.atencionRepo.createQueryBuilder('atencion')
      .leftJoinAndSelect('atencion.paciente', 'paciente')
      .leftJoinAndSelect('atencion.procedimientos', 'procedimientos')
      .where('DATE(atencion.fecha) = CURRENT_DATE')
      .orderBy('atencion.fecha', 'DESC')
      .getMany();
  }

  // NUEVO: OBTENER AGENDA DE CITAS
async obtenerAgenda(inicio: string, fin: string): Promise<DetalleProcedimiento[]> {
    return await this.detalleRepo.createQueryBuilder('procedimiento')
      .leftJoinAndSelect('procedimiento.atencion', 'atencion')
      .leftJoinAndSelect('atencion.paciente', 'paciente')
      // AQUÍ ESTABA EL ERROR: Faltaba el objeto { inicio, fin } al final
      .where('procedimiento.fechaProximaCita BETWEEN :inicio AND :fin', { inicio, fin })
      .andWhere('procedimiento.citaAtendida = false') 
      .orderBy('procedimiento.fechaProximaCita', 'ASC') 
      .addOrderBy('procedimiento.horaProximaCita', 'ASC') 
      .getMany();
  }

  // NUEVO: ATENDER UNA CITA PROGRAMADA
  async atenderCita(idProcedimientoPrevio: string, datos: any): Promise<Atencion> {
    // 1. Buscamos el procedimiento original que generó la cita
    const procAnterior = await this.detalleRepo.findOne({
      where: { id: idProcedimientoPrevio },
      relations: {
        atencion: {
          paciente: true,
        },
      },
    });

    if (!procAnterior) throw new NotFoundException('Cita no encontrada');

    // 2. Marcamos la cita antigua como "Atendida" para que desaparezca de la agenda
    procAnterior.citaAtendida = true;
    await this.detalleRepo.save(procAnterior);

    // 3. Creamos una NUEVA atención usando al mismo paciente
    const paciente = procAnterior.atencion.paciente;
    const nuevaAtencion = this.atencionRepo.create({ 
      paciente,
      origen: 'CITA' 
    });
    const atencionGuardada = await this.atencionRepo.save(nuevaAtencion);

    // 4. Guardamos los nuevos procedimientos/recetas/operaciones que se le hicieron hoy
    if (datos.procedimientos && datos.procedimientos.length > 0) {
      const detalles = datos.procedimientos.map(proc => {
        const total = proc.montoTotal !== null && proc.montoTotal !== undefined ? Number(proc.montoTotal) : null;
        const pagado = Number(proc.montoPagado) || 0;
        
        let esDeuda = false;
        if (total !== null && total > 0) {
          esDeuda = pagado < total;
        }

        return this.detalleRepo.create({
          nombreProcedimiento: proc.nombreProcedimiento,
          fechaProximaCita: proc.fechaProximaCita || null,
          horaProximaCita: proc.horaProximaCita || null,
          montoTotal: total,
          montoPagado: pagado,
          esDeuda,
          atencion: atencionGuardada,
        });
      });
      await this.detalleRepo.save(detalles);
    }

    return atencionGuardada;
  }

  // NUEVO: Solo actualiza la fecha y hora de la cita programada
  async reprogramarCita(idProcedimiento: string, nuevaFecha: string, nuevaHora: string): Promise<DetalleProcedimiento> {
    const procedimiento = await this.detalleRepo.findOne({ where: { id: idProcedimiento } });
    if (!procedimiento) throw new NotFoundException('Procedimiento/Cita no encontrado');

    procedimiento.fechaProximaCita = nuevaFecha ? new Date(nuevaFecha) : null;
    procedimiento.horaProximaCita = nuevaHora || null;

    return await this.detalleRepo.save(procedimiento);
  }
}