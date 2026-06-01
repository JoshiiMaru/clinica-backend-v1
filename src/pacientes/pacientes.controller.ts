import { Controller, Get, Param } from '@nestjs/common';
import { PacientesService } from './pacientes.service';

@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get('dni/:dni')
  buscarPorDni(@Param('dni') dni: string) {
    return this.pacientesService.buscarPorDni(dni);
  }
}