import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Atencion } from './entities/atencion.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { DetalleProcedimiento } from './entities/detalle-procedimiento.entity';
import { DetalleProducto } from './entities/detalle-producto.entity';

@Injectable()
export class AtencionesService {
  constructor(
    @InjectRepository(Atencion) private atencionRepo: Repository<Atencion>,
    @InjectRepository(Paciente) private pacienteRepo: Repository<Paciente>,
    @InjectRepository(DetalleProcedimiento) private detalleRepo: Repository<DetalleProcedimiento>,
    @InjectRepository(DetalleProducto) private productoRepo: Repository<DetalleProducto>,
  ) {}

  // REGISTRO DE ATENCIÓN Y PROCEDIMIENTOS CON MONTOS PROPIOS
  async registrar(datos: any): Promise<Atencion> {
    const { paciente: datosPaciente, procedimientos, productos } = datos; // Ahora extraemos productos

    // Buscar o crear paciente (Se mantiene igual)
    let pacienteGuardado = await this.pacienteRepo.findOne({ where: { dni: datosPaciente.dni } });
    if (!pacienteGuardado) {
      const nuevoPaciente = this.pacienteRepo.create({
        dni: datosPaciente.dni,
        nombre: datosPaciente.nombre,
        celular: datosPaciente.celular
      });
      pacienteGuardado = await this.pacienteRepo.save(nuevoPaciente);
    }

    // Crear el contenedor principal de la atención (Se mantiene igual)
    const nuevaAtencion = this.atencionRepo.create({
      paciente: pacienteGuardado,
      origen: 'ATENCION'
    });
    const atencionGuardada = await this.atencionRepo.save(nuevaAtencion);

    // Guardar procedimientos (Se mantiene igual)
    if (procedimientos && procedimientos.length > 0) {
      const detalles = procedimientos.map(proc => {
        const total = proc.montoTotal !== null && proc.montoTotal !== undefined ? Number(proc.montoTotal) : null;
        const pagado = Number(proc.montoPagado) || 0;
        let esDeuda = (total !== null && total > 0) ? (pagado < total) : false;

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

    // NUEVO: Guardar productos calculando su propia deuda
    if (productos && productos.length > 0) {
      const detallesProductos = productos.map(prod => {
        const total = prod.montoTotal !== null && prod.montoTotal !== undefined ? Number(prod.montoTotal) : null;
        const pagado = Number(prod.montoPagado) || 0;
        let esDeuda = (total !== null && total > 0) ? (pagado < total) : false;

        return this.productoRepo.create({
          nombreProducto: prod.nombreProducto,
          montoTotal: total,
          montoPagado: pagado,
          esDeuda,
          atencion: atencionGuardada,
        });
      });
      await this.productoRepo.save(detallesProductos);
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

  // ABONAR A LA DEUDA: Es inteligente, busca si es un procedimiento o un producto
  async abonarDeudaProcedimiento(idItem: string, abono: number): Promise<any> {
    
    // 1. Intentamos buscar si es un Procedimiento
    let procedimiento = await this.detalleRepo.findOne({ where: { id: idItem } });
    if (procedimiento) {
      procedimiento.montoPagado = Number(procedimiento.montoPagado) + Number(abono);
      if (procedimiento.montoTotal && procedimiento.montoPagado >= procedimiento.montoTotal) {
        procedimiento.esDeuda = false;
      }
      return await this.detalleRepo.save(procedimiento);
    }

    // 2. Si no es un Procedimiento, intentamos buscar si es un Producto
    let producto = await this.productoRepo.findOne({ where: { id: idItem } });
    if (producto) {
      producto.montoPagado = Number(producto.montoPagado) + Number(abono);
      if (producto.montoTotal && producto.montoPagado >= producto.montoTotal) {
        producto.esDeuda = false;
      }
      return await this.productoRepo.save(producto);
    }

    // Si no existe en ninguno de los dos
    throw new NotFoundException('Ítem adeudado no encontrado');
  }

  // OBTENER DEUDAS: Ahora busca en procedimientos y productos al mismo tiempo
  async obtenerDeudas(inicio: string, fin: string, termino?: string): Promise<any[]> {
    const queryProc = this.detalleRepo.createQueryBuilder('procedimiento')
      .leftJoinAndSelect('procedimiento.atencion', 'atencion')
      .leftJoinAndSelect('atencion.paciente', 'paciente')
      .where('procedimiento.esDeuda = :deuda', { deuda: true });

    const queryProd = this.productoRepo.createQueryBuilder('producto')
      .leftJoinAndSelect('producto.atencion', 'atencion')
      .leftJoinAndSelect('atencion.paciente', 'paciente')
      .where('producto.esDeuda = :deuda', { deuda: true });

    // 1. Filtro por fechas para ambos
    if (inicio && fin) {
      queryProc.andWhere('DATE(atencion.fecha) BETWEEN :inicio AND :fin', { inicio, fin });
      queryProd.andWhere('DATE(atencion.fecha) BETWEEN :inicio AND :fin', { inicio, fin });
    }

    // 2. Filtro por DNI o Nombre para ambos
    if (termino) {
      queryProc.andWhere('(paciente.dni LIKE :termino OR paciente.nombre LIKE :termino)', { termino: `%${termino}%` });
      queryProd.andWhere('(paciente.dni LIKE :termino OR paciente.nombre LIKE :termino)', { termino: `%${termino}%` });
    }

    // Ejecutamos ambas búsquedas al mismo tiempo
    const [procedimientos, productos] = await Promise.all([
      queryProc.getMany(),
      queryProd.getMany()
    ]);

    // Añadimos una etiqueta "tipo" para el Frontend
    const procsMapeados = procedimientos.map(p => ({ ...p, tipo: 'PROCEDIMIENTO' }));
    const prodsMapeados = productos.map(p => ({ ...p, tipo: 'PRODUCTO' }));

    // Unimos todo en una sola lista
    const deudasCombinadas = [...procsMapeados, ...prodsMapeados];

    // Ordenamos todo por la fecha de la atención (las más recientes primero)
    deudasCombinadas.sort((a, b) => new Date(b.atencion.fecha).getTime() - new Date(a.atencion.fecha).getTime());

    return deudasCombinadas;
  }

  // OBTENER ATENCIONES DE HOY
  async obtenerAtencionesHoy(): Promise<Atencion[]> {
    return await this.atencionRepo.createQueryBuilder('atencion')
      .leftJoinAndSelect('atencion.paciente', 'paciente')
      .leftJoinAndSelect('atencion.procedimientos', 'procedimientos')
      .leftJoinAndSelect('atencion.productos', 'productos')
      // Convierte la fecha UTC a hora local (UTC-5) solo para el filtrado, sin alterar la base de datos
      .where("DATE(atencion.fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')")
      .orderBy('atencion.fecha', 'DESC')
      .getMany();
  }

  // 3. NUEVO MÉTODO PARA ELIMINAR ATENCIÓN (Como lo pediste si te equivocas)
  async eliminarAtencionCompleta(idAtencion: string): Promise<void> {
    const atencion = await this.atencionRepo.findOne({ where: { id: idAtencion } });
    if (!atencion) throw new NotFoundException('Atención no encontrada');
    
    // Ahora que arreglamos la entidad, esto SOLO borrará la atención y sus hijos (procedimientos/productos)
    await this.atencionRepo.remove(atencion);
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

  // NUEVO: ATENDER UNA CITA PROGRAMADA (Ahora soporta productos)
  async atenderCita(idProcedimientoPrevio: string, datos: any): Promise<Atencion> {
    const { procedimientos, productos } = datos;

    // Validación de seguridad
    if ((!procedimientos || procedimientos.length === 0) && (!productos || productos.length === 0)) {
      throw new BadRequestException('Debes registrar al menos un procedimiento o un producto.');
    }

    // 1. Buscamos el procedimiento original que generó la cita
    const procAnterior = await this.detalleRepo.findOne({
      where: { id: idProcedimientoPrevio },
      relations: { atencion: { paciente: true } },
    });

    if (!procAnterior) throw new NotFoundException('Cita no encontrada');

    // 2. Marcamos la cita antigua como "Atendida"
    procAnterior.citaAtendida = true;
    await this.detalleRepo.save(procAnterior);

    // 3. Creamos una NUEVA atención usando al mismo paciente
    const paciente = procAnterior.atencion.paciente;
    const nuevaAtencion = this.atencionRepo.create({ 
      paciente,
      origen: 'CITA' 
    });
    const atencionGuardada = await this.atencionRepo.save(nuevaAtencion);

    // 4. Guardamos los nuevos procedimientos
    if (procedimientos && procedimientos.length > 0) {
      const detalles = procedimientos.map(proc => {
        const total = proc.montoTotal !== null && proc.montoTotal !== undefined ? Number(proc.montoTotal) : null;
        const pagado = Number(proc.montoPagado) || 0;
        let esDeuda = (total !== null && total > 0) ? (pagado < total) : false;

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

    // 5. NUEVO: Guardamos los nuevos productos (Si vendiste algo durante la cita)
    if (productos && productos.length > 0) {
      const detallesProductos = productos.map(prod => {
        const total = prod.montoTotal !== null && prod.montoTotal !== undefined ? Number(prod.montoTotal) : null;
        const pagado = Number(prod.montoPagado) || 0;
        let esDeuda = (total !== null && total > 0) ? (pagado < total) : false;

        return this.productoRepo.create({
          nombreProducto: prod.nombreProducto,
          montoTotal: total,
          montoPagado: pagado,
          esDeuda,
          atencion: atencionGuardada,
        });
      });
      await this.productoRepo.save(detallesProductos);
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

  // NUEVO: ACTUALIZAR ATENCIÓN COMPLETA (Procedimientos y Productos)
  async actualizarAtencionCompleta(idAtencion: string, datos: any): Promise<Atencion> {
    const atencion = await this.atencionRepo.findOne({
      where: { id: idAtencion },
      relations: {
        procedimientos: true,
        productos: true,
      } // Traemos todo lo que tiene actualmente
    });
    
    if (!atencion) throw new NotFoundException('Atención no encontrada');

    const { procedimientos, productos } = datos;

    // --- LÓGICA PARA PROCEDIMIENTOS ---
    if (procedimientos) {
      // 1. Identificar IDs que vienen del frontend (los que no tienen ID son nuevos)
      const idsMantenidos = procedimientos.filter(p => p.id).map(p => p.id);

      // 2. Eliminar de la BD los que el usuario quitó en la interfaz
      const idsAEliminar = atencion.procedimientos
        .filter(p => !idsMantenidos.includes(p.id))
        .map(p => p.id);
        
      if (idsAEliminar.length > 0) {
        await this.detalleRepo.delete(idsAEliminar);
      }

      // 3. Guardar (crear o actualizar) los procedimientos
      const procedimientosAGuardar = procedimientos.map(proc => {
        const total = proc.montoTotal !== null && proc.montoTotal !== undefined ? Number(proc.montoTotal) : null;
        const pagado = Number(proc.montoPagado) || 0;
        let esDeuda = (total !== null && total > 0) ? (pagado < total) : false;

        return this.detalleRepo.create({
          id: proc.id, // ¡Clave! Si tiene ID, TypeORM lo actualiza; si no, lo inserta nuevo
          nombreProcedimiento: proc.nombreProcedimiento,
          fechaProximaCita: proc.fechaProximaCita || null,
          horaProximaCita: proc.horaProximaCita || null,
          montoTotal: total,
          montoPagado: pagado,
          esDeuda,
          atencion: atencion // Lo volvemos a enlazar
        });
      });
      await this.detalleRepo.save(procedimientosAGuardar);
    }

    // --- LÓGICA PARA PRODUCTOS ---
    if (productos) {
      const idsMantenidosProd = productos.filter(p => p.id).map(p => p.id);
      
      const idsAEliminarProd = atencion.productos
        .filter(p => !idsMantenidosProd.includes(p.id))
        .map(p => p.id);
        
      if (idsAEliminarProd.length > 0) {
        await this.productoRepo.delete(idsAEliminarProd);
      }

      const productosAGuardar = productos.map(prod => {
        const total = prod.montoTotal !== null && prod.montoTotal !== undefined ? Number(prod.montoTotal) : null;
        const pagado = Number(prod.montoPagado) || 0;
        let esDeuda = (total !== null && total > 0) ? (pagado < total) : false;

        return this.productoRepo.create({
          id: prod.id,
          nombreProducto: prod.nombreProducto,
          montoTotal: total,
          montoPagado: pagado,
          esDeuda,
          atencion: atencion
        });
      });
      await this.productoRepo.save(productosAGuardar);
    }

    // Finalmente, retornamos la atención ya actualizada para que el frontend la recargue
    const atencionActualizada = await this.atencionRepo.findOne({ 
      where: { id: idAtencion }, 
      relations: {
        paciente: true,
        procedimientos: true,
        productos: true
      }
    });

    if (!atencionActualizada) throw new NotFoundException('Atención no encontrada');

    return atencionActualizada;
  }
}