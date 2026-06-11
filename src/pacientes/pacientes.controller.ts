import { Controller, Get, Put, Body, Param, Query, UseGuards, Post } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('pacientes')
@UseGuards(AccessTokenGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  // Ruta existente para Atenciones
  @Get('dni/:dni')
  buscarPorDni(@Param('dni') dni: string) {
    return this.pacientesService.buscarPorDni(dni);
  }

  // NUEVA RUTA: Obtener catálogo completo con buscador opcional
  @Get()
  obtenerPacientes(@Query('termino') termino?: string) {
    return this.pacientesService.obtenerPacientes(termino);
  }

  // NUEVA RUTA: Registrar paciente manualmente
  @Post()
  crearPaciente(@Body() datos: any) {
    return this.pacientesService.crearPaciente(datos);
  }

  // NUEVA RUTA: Guardar los cambios editados del paciente
  @Put(':id')
  actualizarPaciente(@Param('id') id: string, @Body() datos: any) {
    return this.pacientesService.actualizarPaciente(id, datos);
  }
}